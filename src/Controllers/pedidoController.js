import { createCVAPedido } from '../services/cvaSoapService.js';
import odooService from '../services/odooService.js';
import cvaClient from '../suppliers/cva/cvaClient.js';

// 🔹 Endpoint manual
export const crearPedidoCVA = async (req, res) => {
  try {
    const pedidoCVA = await createCVAPedido(req.body);
    return res.json({ success: true, pedidoCVA });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const recibirPedidoOdoo = async (req, res) => {
  try {
    console.log('📥 Pedido recibido desde Odoo:', req.body);

    const { id, name, order_line } = req.body;

    if (!id || !name || !order_line) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos desde Odoo'
      });
    }

    const lines = await odooService.getOrderLines(order_line);

    const productos = [];
    const sinStock = new Set(); // 🔥 usar Set mejor
    const lineMap = {}; // 🔥 RELACIÓN clave -> línea Odoo

    for (const line of lines) {
      const productId = line.product_id[0];
      const product = await odooService.getProduct(productId);

      if (product?.x_cva_key) {

        // 🔥 guardar relación
        lineMap[product.x_cva_key] = line.id;

        const cvaData = await cvaClient.getProductByClave(product.x_cva_key);

        if (!cvaData) {
          console.log(`❌ Producto no encontrado en CVA: ${product.x_cva_key}`);
          sinStock.add(product.x_cva_key);
          continue;
        }

        const disponible = parseInt(cvaData.disponible || 0);
        const disponibleCD = parseInt(cvaData.disponibleCD || 0);
        const stockTotal = disponible + disponibleCD;

        if (stockTotal <= 0) {
          console.log(`❌ Sin stock: ${product.x_cva_key}`);
          sinStock.add(product.x_cva_key);
          continue;
        }

        if (line.product_uom_qty > stockTotal) {
          console.log(`⚠️ Stock insuficiente para ${product.x_cva_key}`);
          sinStock.add(product.x_cva_key);
          continue;
        }

        productos.push({
          clave: product.x_cva_key,
          cantidad: line.product_uom_qty
        });
      }
    }

    // 🔥 ELIMINAR LÍNEAS SIN STOCK EN ODOO
    for (const clave of sinStock) {
      const lineId = lineMap[clave];
      if (lineId) {
       await odooService.update('sale.order.line', lineId, {
          product_uom_qty: 0
        });
        console.log(`🧹 Línea puesta en 0 en Odoo: ${clave}`);
      }
    }

    // 🔥 AGREGAR NOTA EN ODOO
    if (sinStock.size > 0) {
      await odooService.update('sale.order', id, {
        note: `❌ Productos sin stock eliminados: ${Array.from(sinStock).join(', ')}`
      });
    }

    // 🔥 SI YA NO QUEDÓ NADA → CANCELAR ENVÍO
    if (productos.length === 0) {
      console.log('❌ Ningún producto con stock disponible');

      return res.json({
        success: false,
        message: 'Ningún producto tiene stock disponible',
        sin_stock: Array.from(sinStock)
      });
    }

    // 🔥 SI SÍ HAY PRODUCTOS → ENVIAR A CVA
    const payload = {
      numOC: name,
      productos
    };

    console.log('🚀 Enviando a CVA:', payload);

    const response = await createCVAPedido(payload);

    const estado = response.estado?.$value;

    if (estado === 'AFECTADO') {
      console.log(`✅ Pedido ${name} confirmado en CVA`);

      await odooService.update('sale.order', id, {
        x_studio_x_enviado_cva: true
      });

    } else {
      console.log('❌ Error CVA:', response.error?.$value);
    }

    return res.json({
      success: true,
      cva: response,
      sin_stock: Array.from(sinStock)
    });

  } catch (error) {
    console.error('❌ Error webhook:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
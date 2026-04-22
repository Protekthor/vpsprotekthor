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

// 🔥 PONER EN 0 LÍNEAS SIN STOCK EN ODOO
    for (const clave of sinStock) {
      const lineId = lineMap[clave];
      if (lineId) {
       await odooService.update('sale.order.line', lineId, {
          product_uom_qty: 0
        });
        console.log(`🧹 Línea puesta en 0 en Odoo: ${clave}`);
      }
    }

    // 🧾 AGREGAR NOTA EN ODOO
if (sinStock.size > 0) {
  await odooService.update('sale.order', id, {
    note: `❌ Productos sin stock eliminados automáticamente: ${Array.from(sinStock).join(', ')}`
  });
}

// 🚨 MARCAR PEDIDO CON ERROR DE STOCK
if (sinStock.size > 0) {
  await odooService.update('sale.order', id, {
    x_sin_stock: true
  });
}
// 🚫 SI NO HAY PRODUCTOS VÁLIDOS → NO ENVIAR A CVA
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


export const validarCarrito = async (req, res) => {
  try {
    const { productos } = req.body;

    const sinStock = [];

    for (const p of productos) {
      const cva = await cvaClient.getProductByClave(p.clave);

      if (!cva) {
        sinStock.push(p.clave);
        continue;
      }

      const disponible = parseInt(cva.disponible || 0);
      const disponibleCD = parseInt(cva.disponibleCD || 0);
      const total = disponible + disponibleCD;

      if (total <= 0 || p.cantidad > total) {
        sinStock.push(p.clave);
      }
    }

    if (sinStock.length > 0) {
      return res.json({
        success: false,
        message: 'Productos sin stock',
        sinStock
      });
    }

    return res.json({
      success: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const validarDesdeOdoo = async (req, res) => {
  try {
    console.log("📥 Webhook Odoo:", req.body);

    const { id, order_line } = req.body;

    // 🔥 1. Obtener líneas reales desde Odoo
    const lines = await odooService.getOrderLines(order_line);

    const sinStock = [];

    for (const line of lines) {
      const productId = line.product_id[0];

      // 🔥 2. Obtener producto
      const product = await odooService.getProduct(productId);

      const clave = product?.x_cva_key;

      if (!clave) continue;

      // 🔥 3. Consultar CVA
      const cva = await cvaClient.getProductByClave(clave);

      if (!cva) {
        sinStock.push(clave);
        continue;
      }

      const total =
        parseInt(cva.disponible || 0) +
        parseInt(cva.disponibleCD || 0);

      if (total <= 0 || line.product_uom_qty > total) {
        sinStock.push(clave);
      }
    }

    // 🔥 4. Actualizar Odoo
    if (sinStock.length > 0) {
      await odooService.update('sale.order', id, {
        x_sin_stock: true,
        note: `❌ Sin stock: ${sinStock.join(', ')}`
      });
    } else {
      await odooService.update('sale.order', id, {
        x_sin_stock: false
      });
    }

    return res.json({ success: true });

  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
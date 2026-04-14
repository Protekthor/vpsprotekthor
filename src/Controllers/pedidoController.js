import { createCVAPedido } from '../services/cvaSoapService.js';
import odooService from '../services/odooService.js';

// 🔹 Endpoint manual (ya lo tenías)
export const crearPedidoCVA = async (req, res) => {
  try {
    const pedidoCVA = await createCVAPedido(req.body);
    return res.json({ success: true, pedidoCVA });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// 🔥 WEBHOOK DE ODOO (NUEVO)
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

    // 🔹 Obtener líneas completas desde Odoo
    const lines = await odooService.getOrderLines(order_line);

    const productos = [];

    for (const line of lines) {
      const productId = line.product_id[0];

      const product = await odooService.getProduct(productId);

      if (product?.x_cva_key) {
        productos.push({
          clave: product.x_cva_key,
          cantidad: line.product_uom_qty
        });
      }
    }

    if (productos.length === 0) {
      console.log('⚠️ Sin productos CVA');
      return res.json({ success: false, message: 'Sin productos CVA' });
    }

    const payload = {
      numOC: name,
      productos
    };

    console.log('🚀 Enviando a CVA:', payload);

    const response = await createCVAPedido(payload);

    const estado = response.estado?.$value;

    if (estado === 'AFECTADO') {
      console.log(`✅ Pedido ${name} confirmado en CVA`);

      // 🔥 marcar como enviado
      await odooService.update('sale.order', id, {
        x_studio_x_enviado_cva: true
      });

    } else {
      console.log(`❌ Error CVA:`, response.error?.$value);
    }

    return res.json({
      success: true,
      cva: response
    });

  } catch (error) {
    console.error('❌ Error webhook:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
import { createCVAPedido } from '../services/cvaSoapService.js';
import odooService from '../services/odooService.js';

export const recibirPedidoOdoo = async (req, res) => {
  try {
    const { id, numOC } = req.body;

    console.log('📥 Pedido recibido:', numOC);

    // 🔥 traer datos desde Odoo
    const order = await odooService.searchRead(
      'sale.order',
      [['id', '=', id]],
      ['id', 'name', 'order_line']
    );

    const lines = await odooService.getOrderLines(order[0].order_line);

    const productos = [];

    for (const line of lines) {
      const product = await odooService.getProduct(line.product_id[0]);

      if (product?.x_cva_key) {
        productos.push({
          clave: product.x_cva_key,
          cantidad: line.product_uom_qty
        });
      }
    }

    const payload = {
      numOC,
      productos
    };

    const response = await createCVAPedido(payload);

    const estado = response.estado?.$value;

    if (estado === 'AFECTADO') {
      await odooService.update('sale.order', id, {
        x_studio_x_enviado_cva: true
      });
    }

    return res.json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false });
  }
};
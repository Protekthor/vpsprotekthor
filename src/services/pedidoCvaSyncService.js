import odooService from './odooService.js';
import axios from 'axios';

export const procesarPedidosCVA = async () => {
  try {
    console.log('🔄 Buscando pedidos en Odoo...');

    const orders = await odooService.getPendingOrders();

    console.log(`📦 Encontrados: ${orders.length}`);

    for (const order of orders) {

      console.log(`➡️ Procesando: ${order.name}`);

      // 🔹 Obtener líneas
      const lines = await odooService.getOrderLines(order.order_line);

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
        continue;
      }

      // 🔥 Payload final
      const payload = {
        numOC: order.name,
        productos
      };

      console.log('🚀 Enviando a CVA:', payload);

      // 👉 Llamas a tu endpoint existente
      await axios.post('http://localhost:3000/api/crear-pedido-cva', payload);

      // ✅ Marcar como enviado
      await odooService.markOrderAsSent(order.id);

      console.log(`✅ Pedido ${order.name} enviado`);
    }

  } catch (error) {
    console.error('❌ Error en sincronización:', error.message);
  }
};
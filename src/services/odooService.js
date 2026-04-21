import axios from 'axios';
import config from '../config/index.js';

class OdooService {
  constructor() {
    this.url = config.odoo.url;
    this.db = config.odoo.db;
    this.username = config.odoo.username;
    this.apiKey = config.odoo.apiKey;
  }

  getHeaders() {
    return {
      Authorization: `bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Odoo-Database': this.db,
    };
  }

  async call(model, method, params = {}) {
    const endpoint = `${this.url}/json/2/${model}/${method}`;
    try {
      const response = await axios.post(endpoint, params, {
        headers: this.getHeaders(),
        timeout: 20000,
      });
      return response.data;
    } catch (error) {
      console.error(`Odoo call error (${model}.${method}):`, error.response?.data || error.message);
      throw error;
    }
  }

  async searchRead(model, domain, fields = [], limit = null) {
    const params = { domain, fields };
    if (limit) params.limit = limit;
    return this.call(model, 'search_read', params);
  }

async create(model, valsList) {
  // Siempre convertir a array (vals_list) como espera Odoo
  const records = Array.isArray(valsList) ? valsList : [valsList];
  return this.call(model, 'create', { vals_list: records });
}
  async update(model, ids, vals) {
    return this.call(model, 'write', { ids: Array.isArray(ids) ? ids : [ids], vals });
  }

  // Métodos específicos para productos
  async findProductBySku(sku) {
    const result = await this.searchRead('product.template', [['default_code', '=', sku]], ['id', 'name', 'default_code'], 1);
    return result && result.length ? result[0] : null;
  }

  async createProduct(productData) {
    return this.create('product.template', productData);
  }

  async updateProduct(id, productData) {
    return this.update('product.template', id, productData);
  }

  async getCurrentUser() {
    return this.searchRead('res.users', [['login', '=', this.username]], ['id', 'name', 'login'], 1);
  }

  // 🔥 Obtener pedidos no enviados
async getPendingOrders() {
  return this.searchRead(
    'sale.order',
    [
      ['x_studio_listo_para_cva', '=', true],
      ['x_studio_x_enviado_cva', '=', false]
    ],
    ['id', 'name', 'partner_id', 'order_line']
  );
}

// 🔥 Obtener líneas de pedido
async getOrderLines(lineIds) {
  return this.searchRead(
    'sale.order.line',
    [['id', 'in', lineIds]],
    ['id', 'product_id', 'product_uom_qty']
  );
}

// 🔥 Obtener producto con clave CVA
async getProduct(productId) {
  const result = await this.searchRead(
    'product.product',
    [['id', '=', productId]],
    ['id', 'x_cva_key']
  );
  return result[0];
}

// 🔥 Marcar pedido como enviado
async markOrderAsSent(orderId) {
  return this.update('sale.order', orderId, {
    x_studio_x_enviado_cva: true
  });
}

async deleteOrderLine(lineId) {
  return this.call('sale.order.line', 'unlink', {
    ids: [lineId]
  });
}
}

export default new OdooService();
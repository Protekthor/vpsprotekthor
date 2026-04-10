import axios from 'axios';
import config from '../../config/index.js';
import { parseXML, normalizeCvaResponse } from '../../shared/utils/xmlParser.js';

class CVAClient {
  constructor() {
    this.baseURL = config.cva.baseUrl;
    this.cliente = config.cva.cliente;
    this.defaultParams = {
      cliente: this.cliente,
      porcentaje: config.cva.defaultParams.porcentaje,
      MonedaPesos: config.cva.defaultParams.MonedaPesos,
      tc: config.cva.defaultParams.tc,
    };
  }

  // Método genérico para consultar productos con parámetros adicionales
  async fetchProducts(params = {}) {
    const queryParams = { ...this.defaultParams, ...params };
    try {
      const response = await axios.get(this.baseURL, {
        params: queryParams,
        timeout: 30000,
        responseType: 'text', // para obtener XML como string
      });
      const parsed = await parseXML(response.data);
      const items = normalizeCvaResponse(parsed);
      return items;
    } catch (error) {
      console.error('Error fetching products from CVA:', error.message);
      throw new Error(`CVA API error: ${error.message}`);
    }
  }

  // Obtener todos los productos de una marca
  async getProductsByMarca(marca) {
    return this.fetchProducts({ marca });
  }

  // Obtener todos los productos de un grupo
  async getProductsByGrupo(grupo) {
    return this.fetchProducts({ grupo });
  }

  // Obtener producto por clave CVA
  async getProductByClave(clave) {
    const items = await this.fetchProducts({ clave });
    return items.length > 0 ? items[0] : null;
  }

  // Obtener producto por código de fabricante
  async getProductByCodigo(codigo) {
    const items = await this.fetchProducts({ codigo });
    return items.length > 0 ? items[0] : null;
  }

  // Búsqueda genérica
  async searchProducts(desc) {
    return this.fetchProducts({ desc });
  }
}

export default new CVAClient();
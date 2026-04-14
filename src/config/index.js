import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env según el nombre real de tu archivo
dotenv.config({ path: path.resolve(__dirname, '../../variables.env') });

const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  odoo: {
    url: process.env.ODOO_URL?.trim().replace(/\/+$/, ''),
    db: process.env.ODOO_DB?.trim(),
    username: process.env.ODOO_USERNAME?.trim(),
    apiKey: process.env.ODOO_PASSWORD?.trim(),
  },
  
  cva: {
    baseUrl: 'http://www.grupocva.com/catalogo_clientes_xml/lista_precios.xml',
    cliente: process.env.CVA_CLIENTE, // Número de cliente (ej. 23534)
    // Opcional: otros parámetros por defecto


  soapUser: process.env.CVA_SOAP_USER,
  soapPassword: process.env.CVA_SOAP_PASSWORD,
    defaultParams: {
      porcentaje: 15, // ya que quieres incrementar 15% sobre el precio base
      MonedaPesos: 1, // precios en pesos mexicanos
      tc: 1, // tipo de cambio si aplica
    }
    
  },
  
  sync: {
    // Configuración de sincronización automática (cron)
    autoSync: process.env.AUTO_SYNC === 'true',
    syncInterval: process.env.SYNC_INTERVAL || '0 */6 * * *', // cada 6 horas
  }
};

// Validaciones
if (!config.odoo.url) throw new Error('Falta ODOO_URL');
if (!config.odoo.db) throw new Error('Falta ODOO_DB');
if (!config.odoo.username) throw new Error('Falta ODOO_USERNAME');
if (!config.odoo.apiKey) throw new Error('Falta ODOO_PASSWORD');
if (!config.cva.cliente) throw new Error('Falta CVA_CLIENTE en .env');

export default config;
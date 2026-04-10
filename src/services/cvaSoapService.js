import soap from 'soap';
import config from '../config/index.js';

const WSDL_URL = 'https://www.grupocva.com/pedidos_web/pedidos_ws_cva.php?wsdl';

export async function createCVAPedido(pedidoData) {
  const client = await soap.createClientAsync(WSDL_URL);
  
  // Construir el XML del pedido según documentación de CVA
  const xmlPedido = `
    <PEDIDO>
      <NumOC>${pedidoData.numOC}</NumOC>
      <Paqueteria>${pedidoData.paqueteria || '0'}</Paqueteria>
      <CodigoSucursal>${pedidoData.codigoSucursal || '1'}</CodigoSucursal>
      <PedidoBO>N</PedidoBO>
      <Observaciones>${pedidoData.observaciones || ''}</Observaciones>
      <productos>
        ${pedidoData.productos.map(p => `
          <producto>
            <clave>${p.clave}</clave>
            <cantidad>${p.cantidad}</cantidad>
          </producto>
        `).join('')}
      </productos>
      <TipoFlete>${pedidoData.tipoFlete || 'SF'}</TipoFlete>
      <Calle>${pedidoData.calle}</Calle>
      <Numero>${pedidoData.numero}</Numero>
      <NumeroInt>${pedidoData.numeroInt || ''}</NumeroInt>
      <Colonia>${pedidoData.colonia}</Colonia>
      <Estado>${pedidoData.estado}</Estado>
      <Ciudad>${pedidoData.ciudad}</Ciudad>
      <Atencion>${pedidoData.atencion}</Atencion>
    </PEDIDO>
  `;

  const args = {
    Usuario: config.cva.soapUser,     // Tu usuario ME
    PWD: config.cva.soapPassword,     // Tu contraseña ME
    XMLOC: xmlPedido
  };

  const result = await client.PedidoWebAsync(args);
  return result[0]; // respuesta
}
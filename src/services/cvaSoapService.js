import soap from 'soap';
import config from '../config/index.js';

const WSDL_URL = 'https://www.grupocva.com/pedidos_web/pedidos_ws_cva.php?wsdl';

export async function createCVAPedido(pedidoData) {
  const client = await soap.createClientAsync(WSDL_URL);

  // 🔥 XML con valores seguros (sin undefined)
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
      <Calle>${pedidoData.calle || 'NA'}</Calle>
      <Numero>${pedidoData.numero || '0'}</Numero>
      <NumeroInt>${pedidoData.numeroInt || ''}</NumeroInt>
      <Colonia>${pedidoData.colonia || 'NA'}</Colonia>
      <Estado>${pedidoData.estado || '1'}</Estado>
      <Ciudad>${pedidoData.ciudad || '1'}</Ciudad>
      <Atencion>${pedidoData.atencion || 'Cliente'}</Atencion>
    </PEDIDO>
  `;

  const args = {
    Usuario: config.cva.soapUser,
    PWD: config.cva.soapPassword,
    XMLOC: xmlPedido
  };

  const result = await client.PedidoWebAsync(args);

  // 🔥 DEBUG
  console.log('📦 RESPUESTA CRUDA CVA:', result);

  const response = result[0];

  console.log('📦 RESPUESTA PROCESADA CVA:', response);

  return response;
}
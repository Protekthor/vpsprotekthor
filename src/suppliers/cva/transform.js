// Aplica el 15% de incremento sobre el precio base (precio que da CVA)
// Nota: CVA ya puede devolver precio con porcentaje si usas parámetro porcentaje.
// Pero aquí aseguraremos el 15% extra sobre el precio que recibimos.
export function transformCvaToOdoo(cvaItem) {
  // Extraer campos relevantes
  const clave = cvaItem.clave || '';
  const codigoFabricante = cvaItem.codigo_fabricante || '';
  const descripcion = cvaItem.descripcion || '';
  const precioOriginal = parseFloat(cvaItem.precio) || 0;
  // Aplicar 15% adicional (si ya se aplicó porcentaje en la consulta, esto sería doble incremento)
  // Según tu requerimiento: "ponerles un 15% mas de costo sobre producto"
  // Asumimos que el precio que viene de CVA es el costo base (sin utilidad)
  const precioConMargen = +(precioOriginal * 1.15).toFixed(2);
  
  // Construir default_code: priorizar clave CVA, si no, código fabricante
  const defaultCode = clave || (codigoFabricante ? `EXT-${codigoFabricante}` : 'SIN-CODIGO');
  
  // Mapeo a campos de product.template en Odoo
  return {
    name: descripcion.substring(0, 200), // limitar longitud
    default_code: defaultCode,
    list_price: precioConMargen, // precio de venta (con 15% de margen)
    description_sale: descripcion,
    // Otros campos opcionales
    type: 'consu', // consumible
    sale_ok: true,
    purchase_ok: true,
    // Podrías agregar más como:
    // barcode: cvaItem.upc,
    // weight: cvaItem.peso ? parseFloat(cvaItem.peso) : null,
    // product_image_url: cvaItem.imagen,
  };
}

// Para manejar lotes
export function transformMany(cvaItems) {
  return cvaItems.map(transformCvaToOdoo);
}
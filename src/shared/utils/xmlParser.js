import { parseStringPromise } from 'xml2js';

export async function parseXML(xmlData) {
  try {
    const result = await parseStringPromise(xmlData, {
      explicitArray: false,
      mergeAttrs: true,
      trim: true,
    });
    return result;
  } catch (error) {
    throw new Error(`Error parsing XML: ${error.message}`);
  }
}

// Normalizar la respuesta de CVA (puede ser un solo item o múltiples)
export function normalizeCvaResponse(parsedXml) {
  // La estructura suele ser <articulos><item>...</item></articulos>
  const articulos = parsedXml?.articulos?.item;
  if (!articulos) return [];
  // Si es un solo item, convertirlo a array
  return Array.isArray(articulos) ? articulos : [articulos];
}
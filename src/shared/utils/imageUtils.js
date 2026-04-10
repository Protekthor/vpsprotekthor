import axios from 'axios';

/**
 * Descarga una imagen desde una URL y la convierte a Base64
 * @param {string} imageUrl - URL de la imagen (ej: http://...jpg)
 * @returns {Promise<string|null>} - Cadena Base64 o null si falla
 */
export async function downloadImageToBase64(imageUrl) {
  if (!imageUrl) return null;
  
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 segundos máximo
    });
    
    // Convertir el buffer a Base64
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return base64;
  } catch (error) {
    console.error(`Error descargando imagen ${imageUrl}:`, error.message);
    return null; // Si falla, no asignamos imagen
  }
}
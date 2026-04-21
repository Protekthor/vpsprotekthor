import cvaClient from '../suppliers/cva/cvaClient.js';
import odooService from '../services/odooService.js';
import { transformCvaToOdoo } from '../suppliers/cva/transform.js';
import { downloadImageToBase64 } from '../shared/utils/imageUtils.js';

export const syncProducts = async (req, res, next) => {

  try {
   const { marca, grupo, clave } = req.query;
    console.log('📥 req.query:', req.query);
    console.log('🔑 clave:', clave, 'tipo:', typeof clave);
    
    let cvaProducts = [];
    
    if (clave) {
      console.log('✅ Entrando a bloque CLAVE');
      const product = await cvaClient.getProductByClave(clave);
      console.log('📦 Producto encontrado?', product ? 'Sí' : 'No');
      if (product) cvaProducts = [product];
    } else if (marca) {
      console.log('✅ Entrando a bloque MARCA');
      cvaProducts = await cvaClient.getProductsByMarca(marca);
    } else if (grupo) {
      console.log('✅ Entrando a bloque GRUPO');
      cvaProducts = await cvaClient.getProductsByGrupo(grupo);
    } else {
      console.log('❌ No entró a ningún bloque. clave:', clave, 'marca:', marca, 'grupo:', grupo);
      throw new Error('Debe proporcionar al menos un filtro: marca, grupo o clave');
    }
    
    
const results = {
  total: cvaProducts.length,
  con_stock: productosDisponibles.length,
  sin_stock: productosSinStock.length,
  created: 0,
  updated: 0,
  errors: [],
  details: [],
};
    

    // 🔥 FILTRAR PRODUCTOS CON STOCK REAL
const productosDisponibles = cvaProducts.filter(p => {
  const disponible = parseInt(p.disponible || 0);
  const disponibleCD = parseInt(p.disponibleCD || 0);

  return disponible > 0 || disponibleCD > 0;
});

const productosSinStock = cvaProducts.filter(p => {
  const disponible = parseInt(p.disponible || 0);
  const disponibleCD = parseInt(p.disponibleCD || 0);

  return disponible <= 0 && disponibleCD <= 0;
});

console.log(`✅ Con stock: ${productosDisponibles.length}`);
console.log(`❌ Sin stock: ${productosSinStock.length}`);
    
for (const cvaItem of productosDisponibles) {
      try {
        // 1. Datos básicos del producto (incluye precio con +15%)
        const odooData = transformCvaToOdoo(cvaItem);
        
        // 2. Descargar y convertir imagen si existe URL
        if (cvaItem.imagen) {
          const imageBase64 = await downloadImageToBase64(cvaItem.imagen);
          if (imageBase64) {
            odooData.image_1920 = imageBase64; // Campo de Odoo para imagen grande
            // Opcional: también puedes asignar image_1024, image_512, etc.
            // odooData.image_1024 = imageBase64;
          }
        }
        
        // 3. Buscar si ya existe en Odoo
        const existing = await odooService.findProductBySku(odooData.default_code);
        
        if (existing) {
          await odooService.updateProduct(existing.id, odooData);
          results.updated++;
          results.details.push({ sku: odooData.default_code, action: 'updated', id: existing.id });
        } else {
          const newId = await odooService.createProduct(odooData);
          results.created++;
          results.details.push({ sku: odooData.default_code, action: 'created', id: newId });
        }
      } catch (err) {
        results.errors.push({
          sku: cvaItem.clave || cvaItem.codigo_fabricante,
          error: err.message,
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Sincronización completada',
      results,
        sin_stock: productosSinStock.map(p => p.clave)
    });
  } catch (error) {
    next(error);
  }
};

// Endpoint para probar conexión con Odoo
export const testOdoo = async (req, res, next) => {
  try {
    const user = await odooService.getCurrentUser();
    res.json({ success: true, message: 'Conexión exitosa con Odoo', user });
  } catch (error) {
    next(error);
  }
};

// Endpoint para obtener productos de CVA (sin sincronizar, solo vista previa)
export const previewProducts = async (req, res, next) => {
  try {
    const { marca, grupo, clave, desc } = req.query;
    let products = [];

    if (clave) {
      const prod = await cvaClient.getProductByClave(clave);
      if (prod) products = [prod];
    } else if (marca) {
      products = await cvaClient.getProductsByMarca(marca);
    } else if (grupo) {
      products = await cvaClient.getProductsByGrupo(grupo);
    } else if (desc) {
      products = await cvaClient.searchProducts(desc);
    } else {
      throw new Error('Se requiere al menos un parámetro de búsqueda');
    }

    // 🔥 AQUÍ VA EL FILTRO (ya con products definido)
    const preview = products
      .filter(p => {
        const disponible = parseInt(p.disponible || 0);
        const disponibleCD = parseInt(p.disponibleCD || 0);
        return disponible > 0 || disponibleCD > 0;
      })
      .map(p => ({
        original_price: parseFloat(p.precio),
        final_price: +(parseFloat(p.precio) * 1.15).toFixed(2),
        ...p
      }));

    res.json({
      success: true,
      count: preview.length,
      products: preview
    });

  } catch (error) {
    next(error);
  }
};
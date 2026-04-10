import express from "express";
import dotenv from "dotenv";
import axios from "axios";

// Si tu archivo se llama ".env"
dotenv.config();

// Si tu archivo se llama "variables.env", usa esta línea en lugar de la de arriba:
// dotenv.config({ path: "variables.env" });

const app = express();

// ==============================
// CONFIG
// ==============================
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

const ODOO_URL = (process.env.ODOO_URL || "").trim().replace(/\/+$/, "");
const ODOO_DB = (process.env.ODOO_DB || "").trim();
const ODOO_USERNAME = (process.env.ODOO_USERNAME || "").trim();
const ODOO_API_KEY = (process.env.ODOO_PASSWORD || "").trim();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// VALIDACIÓN ENV
// ==============================
if (!ODOO_URL) {
  throw new Error("Falta ODOO_URL en .env");
}
if (!ODOO_DB) {
  throw new Error("Falta ODOO_DB en .env");
}
if (!ODOO_USERNAME) {
  throw new Error("Falta ODOO_USERNAME en .env");
}
if (!ODOO_API_KEY) {
  throw new Error("Falta ODOO_PASSWORD (API KEY) en .env");
}



// ==============================
// HEADERS ODOO
// ==============================
function getOdooHeaders() {
  return {
    Authorization: `bearer ${ODOO_API_KEY}`,
    "Content-Type": "application/json",
    "X-Odoo-Database": ODOO_DB,
  };
}

// ==============================
// LLAMADA GENÉRICA A ODOO JSON-2
// ==============================
async function odooCall(model, method, payload = {}) {
  const url = `${ODOO_URL}/json/2/${model}/${method}`;

  const response = await axios.post(url, payload, {
    headers: getOdooHeaders(),
    timeout: 20000,
  });


  return response.data;
}

// ==============================
// API EXTERNA
// ==============================
async function obtenerProductosExternos() {
  const response = await axios.get("https://fakestoreapi.com/products", {
    timeout: 20000,
  });
  return response.data;
}

function transformarProductoAOdoo(producto) {
  return {
    name: producto.title,
    default_code: `EXT-${producto.id}`,
    list_price: +(Number(producto.price || 0) * 1.15).toFixed(2),
    description_sale: producto.description || "",
    type: "consu",
    sale_ok: true,
    purchase_ok: true,
  };   

}

// ==============================
// SERVICIOS ODOO
// ==============================
async function buscarUsuarioActual() {
  return await odooCall("res.users", "search_read", {
    domain: [["login", "=", ODOO_USERNAME]],
    fields: ["id", "name", "login"],
    limit: 1,
  });
}

async function buscarProductoPorSKU(sku) {
  const result = await odooCall("product.template", "search_read", {
    domain: [["default_code", "=", sku]],
    fields: ["id", "name", "default_code"],
    limit: 1,
  });


 return Array.isArray(result) && result.length ? result[0] : null;
}

async function crearProductoEnOdoo(data) {
  return await odooCall("product.template", "create", {
    vals_list: [data],
  });
}

async function actualizarProductoEnOdoo(id, data) {
  return await odooCall("product.template", "write", {
    ids: [id],
    vals: data,
  });
}

// ==============================
// RUTAS
// ==============================


// health
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Servidor funcionando correctamente",
    environment: process.env.NODE_ENV || "development",
  });
});

// ver productos transformados
app.get("/productos", async (req, res) => {
  try {
    const productosExternos = await obtenerProductosExternos();
    const productos = productosExternos.map(transformarProductoAOdoo);

    res.status(200).json({
      status: "success",
      total_productos: productos.length,
      productos,
    });


} catch (error) {
    console.error("ERROR /productos:", error.response?.data || error);

    res.status(500).json({
      status: "error",
      message: "Error al consumir la API externa",
      error: error.message,
      detail: error.response?.data || null,
      code: error.code || null,
    });
  }
});

// probar conexión con Odoo
app.get("/test-odoo", async (req, res) => {
  try {
    const result = await buscarUsuarioActual();



    res.status(200).json({
      status: "success",
      message: "Conexión exitosa con Odoo",
      result,
    });
  } catch (error) {
    console.error("ERROR /test-odoo:", error.response?.data || error);

    res.status(500).json({
      status: "error",
      message: "No se pudo conectar con Odoo",
      error: error.message,
      detail: error.response?.data || null,
      code: error.code || null,
    });
  }
});

// crear un producto de prueba
app.get("/crear-test", async (req, res) => {
  try {
    const sku = "TEST-001";


    const existente = await buscarProductoPorSKU(sku);

    if (existente) {
      return res.status(200).json({
        status: "warning",
        message: "El producto de prueba ya existe",
        product_template_id: existente.id,
        producto: existente,
      });
    }

    const nuevoId = await crearProductoEnOdoo({
      name: "Producto prueba API",
      default_code: sku,
      list_price: 100,
      description_sale: "Producto creado desde VPS por API",
      type: "consu",
      sale_ok: true,
      purchase_ok: true,
    });

 res.status(200).json({
      status: "success",
      message: "Producto de prueba creado en Odoo",
      result: nuevoId,
    });
  } catch (error) {
    console.error("ERROR /crear-test:", error.response?.data || error);

    res.status(500).json({
      status: "error",
      message: "No se pudo crear el producto de prueba",
      error: error.message,
      detail: error.response?.data || null,
      code: error.code || null,
    });
  }
});


// sincronización real
app.get("/sync-odoo", async (req, res) => {
  try {
    const productosExternos = await obtenerProductosExternos();
    const productosOdoo = productosExternos.map(transformarProductoAOdoo);

    let creados = 0;
    let actualizados = 0;
    const detalle = [];

    for (const producto of productosOdoo) {
      try {
        const existente = await buscarProductoPorSKU(producto.default_code);

        if (existente) {
          await actualizarProductoEnOdoo(existente.id, producto);
          actualizados++;


          detalle.push({
            sku: producto.default_code,
            nombre: producto.name,
            accion: "actualizado",
            product_template_id: existente.id,
          });
        } else {
          const nuevoId = await crearProductoEnOdoo(producto);
          creados++;

          detalle.push({
            sku: producto.default_code,
            nombre: producto.name,
            accion: "creado",
            result: nuevoId,
          });
        }
      } catch (itemError) {
        console.error(`ERROR producto ${producto.default_code}:`, itemError.response?>



        detalle.push({
          sku: producto.default_code,
          nombre: producto.name,
          accion: "error",
          error: itemError.message,
          detail: itemError.response?.data || null,
          code: itemError.code || null,
        });
      }
    }

    res.status(200).json({
      status: "success",
      message: "Sincronización terminada",
      total: productosOdoo.length,
      creados,
      actualizados,
      detalle,
    });
} catch (error) {
    console.error("ERROR /sync-odoo:", error.response?.data || error);

    res.status(500).json({
      status: "error",
      message: "Error general en la sincronización con Odoo",
      error: error.message,
      detail: error.response?.data || null,
      code: error.code || null,
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Ruta no encontrada",
  });
});



// ==============================
// START
// ==============================
app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});

PORT=3000
NODE_ENV=development

ODOO_URL=https://digitcom.odoo.com/
ODOO_DB=digitcom
ODOO_USERNAME=ingenieria@digitcom.com.mx
ODOO_PASSWORD=7e1520207c7b541cd87a5f65c86e9f3bd148255a

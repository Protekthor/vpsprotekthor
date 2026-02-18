import { getProductsForOdoo } from "../services/products.service.js";

export async function listProducts(req, res, next) {
  try {
    // opcional: permitir margen por query ?margin=15
    const margin = req.query.margin ? Number(req.query.margin) : undefined;

    const data = await getProductsForOdoo({ margin });
    res.json({
      source: "fakestore",
      count: data.length,
      products: data
    });
  } catch (e) {
    next(e);
  }
}

import { fakestoreGetProducts } from "../suppliers/fakestore/fakestore.api.js";
import { adaptFakeStoreProduct } from "../suppliers/fakestore/fakestore.adapter.js";
import { addMarginPercent } from "../shared/utils/money.js";

export async function getProductsForOdoo({ margin } = {}) {
  const raw = await fakestoreGetProducts();

  const marginPercent =
    Number.isFinite(margin) ? margin : Number(process.env.MARGIN_PERCENT || 0);

    

  // Convertimos a formato estándar para Odoo/tu app
  return raw.map((p) => {
    const std = adaptFakeStoreProduct(p);

    // Simulación de “precio final con margen”
    const priceWithMargin = addMarginPercent(std.price, marginPercent);

    return {
      ...std,
      price_with_margin: priceWithMargin,
      margin_percent: marginPercent
    };
  });
}

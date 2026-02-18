export function adaptFakeStoreProduct(p) {
  return {
    external_id: String(p.id),
    sku: `FAKE-${p.id}`,      // simulación de SKU
    name: p.title,
    description: p.description,
    category: p.category,
    image: p.image,
    price: Number(p.price),
    rating: p?.rating?.rate ?? null,
    rating_count: p?.rating?.count ?? null
  };
}

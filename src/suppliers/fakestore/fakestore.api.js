import { fakestoreClient } from "./fakestore.client.js";

export async function fakestoreGetProducts() {
  const { data } = await fakestoreClient.get("/products");
  return data; // array
}

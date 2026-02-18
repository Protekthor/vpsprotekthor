import axios from "axios";

export const fakestoreClient = axios.create({
  baseURL: process.env.FAKESTORE_BASE_URL || "https://fakestoreapi.com",
  timeout: 15000
});

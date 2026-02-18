import { Router } from "express";
import { authOdoo } from "../../middlewares/authOdoo.middleware.js";
import { listProducts } from "../../Controllers/products.controller.js";

const router = Router();

// Odoo consumiría este endpoint
router.get("/products", authOdoo, listProducts);

export default router;

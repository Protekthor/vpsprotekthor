import { Router } from "express";
import v1ProductsRoutes from "./v1/products.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.use("/v1", v1ProductsRoutes);

export default router;

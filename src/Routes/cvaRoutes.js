import express from 'express';
import { syncProducts, testOdoo, previewProducts } from '../Controllers/cvaController.js';
import { crearPedidoCVA, recibirPedidoOdoo } from '../Controllers/pedidoController.js';

const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'CVA-Odoo Sync' });
});

// Odoo
router.get('/test-odoo', testOdoo);

// Productos
router.get('/preview', previewProducts);
router.get('/sync', syncProducts);

// CVA manual
router.post('/crear-pedido-cva', crearPedidoCVA);

// 🔥 WEBHOOK DESDE ODOO (IMPORTANTE)
router.post('/webhook/odoo', recibirPedidoOdoo);

export default router;
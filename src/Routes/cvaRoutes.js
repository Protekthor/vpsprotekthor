import express from 'express';
import { syncProducts, testOdoo, previewProducts } from '../Controllers/cvaController.js';

import { crearPedidoCVA } from '../Controllers/pedidoController.js';
const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'CVA-Odoo Sync' });
});

router.get('/test-odoo', testOdoo);
router.get('/preview', previewProducts);
router.get('/sync', syncProducts);


router.post('/crear-pedido-cva', crearPedidoCVA);
export default router;
import { createCVAPedido } from '../services/cvaSoapService.js';

export const crearPedidoCVA = async (req, res) => {
  try {
    const pedidoCVA = await createCVAPedido(req.body);
    res.json({ success: true, pedidoCVA });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
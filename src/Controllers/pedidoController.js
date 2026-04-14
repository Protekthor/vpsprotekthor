import { createCVAPedido } from '../services/cvaSoapService.js';

export const crearPedidoCVA = async (req, res) => {
  try {
    const pedidoCVA = await createCVAPedido(req.body);
    return res.json({ success: true, pedidoCVA }); // 👈 IMPORTANTE
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message }); // 👈 IMPORTANTE
  }
};
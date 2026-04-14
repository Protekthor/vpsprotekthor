import express from 'express';
import config from './src/config/index.js';
import apiRoutes from './src/Routes/cvaRoutes.js';
import { errorHandler } from './src/middlewares/errorHandler.js';

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api', apiRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ message: 'VPS Integración CVA - Odoo', version: '1.0.0' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Error handler
app.use(errorHandler);


// Iniciar servidor
app.listen(config.port, config.host, () => {
  console.log(`Servidor corriendo en http://${config.host}:${config.port}`);
  console.log(`Entorno: ${config.nodeEnv}`);
  console.log(`Cliente CVA: ${config.cva.cliente}`);
});
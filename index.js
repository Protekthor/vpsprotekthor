import express from "express";
import dotenv from "dotenv";

import routes from "./src/Routes/index.routes.js";
import { notFound } from "./src/middlewares/notFound.middleware.js";
import { errorHandler } from "./src/middlewares/error.middleware.js";

dotenv.config({ path: "variables.env" });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(` Servidor corriendo en puerto ${PORT}`);
});

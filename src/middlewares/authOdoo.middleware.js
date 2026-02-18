export function authOdoo(req, res, next) {
  const requiredKey = process.env.ODOO_API_KEY;
  if (!requiredKey) return next()

  const key = req.headers["x-odoo-key"];
  if (!key || key !== requiredKey) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Missing or invalid x-odoo-key"
    });
  }
  next();
}

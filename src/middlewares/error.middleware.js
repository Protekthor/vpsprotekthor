export function errorHandler(err, req, res, next) {
  console.error(" Error:", err?.message || err);
  res.status(500).json({
    error: "INTERNAL_ERROR",
    message: "Something went wrong"
  });
}

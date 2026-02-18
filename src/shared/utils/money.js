export function addMarginPercent(price, percent) {
  const p = Number(price);
  const m = Number(percent);
  if (!Number.isFinite(p) || !Number.isFinite(m)) return p;
  const result = p + (p * m) / 100;
  // redondeo 2 decimales
  return Math.round(result * 100) / 100;
}

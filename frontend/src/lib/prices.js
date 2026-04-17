/** Coerce product/cart price (API string or number) to a finite number. */
export function priceNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

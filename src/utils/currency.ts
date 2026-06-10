/** Mongolian Tugrik display for UI (API/DB amounts unchanged). */
export function formatPrice(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0
  return `₮${safe.toLocaleString("mn-MN")}`
}

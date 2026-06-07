/** Mongolian Tugrik display for UI (API/DB amounts unchanged). */
export function formatPrice(amount: number): string {
  return `₮${amount.toLocaleString("mn-MN")}`
}

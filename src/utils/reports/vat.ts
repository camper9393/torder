/** НӨАТ-ын хувь — тохируулах бол энд өөрчилнө */
export const DEFAULT_VAT_RATE = 0.1;

/** Үнэд НӨАТ багтсан гэж үзнэ */
export function calcVatFromInclusive(amount: number, rate = DEFAULT_VAT_RATE) {
  if (amount <= 0) return 0;
  return Math.round((amount * rate) / (1 + rate));
}

export function calcTaxableFromGross(gross: number, refunds: number) {
  return Math.max(0, gross - refunds);
}

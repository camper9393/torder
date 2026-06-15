/** Platform owner-д ресторан контекст шаарддаг POS замууд */
const POS_RESTAURANT_CONTEXT_PREFIXES = [
  "/menu",
  "/admin/tablet-order",
  "/admin/tables",
  "/admin/inventory",
  "/inventory",
] as const;

export function requiresPosRestaurantContext(pathname: string | null): boolean {
  if (!pathname) return false;
  return POS_RESTAURANT_CONTEXT_PREFIXES.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
}

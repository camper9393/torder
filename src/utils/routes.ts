/** Customer tablet menu + checkout (no site chrome). */
export function isConsumerTabletRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return /^\/consumer\/[^/]+(\/checkout)?\/?$/.test(pathname)
}

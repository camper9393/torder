/** Customer tablet menu + checkout (no site chrome). */
export function isConsumerTabletRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return /^\/consumer\/[^/]+(\/checkout)?\/?$/.test(pathname)
}

/** Full-screen staff displays (no site navbar). */
export function isKitchenTvRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === "/kitchen-tv" || pathname.startsWith("/kitchen-tv/")
}

/** Merchant staff pages use the left sidebar for all navigation. */
export function usesMerchantSidebar(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname.startsWith("/admin")) return true
  if (pathname === "/inventory" || pathname.startsWith("/inventory/")) return true
  if (pathname.startsWith("/dashboard/")) return true
  if (pathname === "/menu" || pathname.startsWith("/menu/")) return true
  if (pathname === "/qr-manager" || pathname.startsWith("/qr-manager/")) return true
  if (pathname === "/kitchen" || pathname.startsWith("/kitchen/")) return true
  if (pathname === "/tables" || pathname.startsWith("/tables/")) return true
  return false
}

export function hidesSiteNavBar(pathname: string | null): boolean {
  return (
    isConsumerTabletRoute(pathname) ||
    isKitchenTvRoute(pathname) ||
    usesMerchantSidebar(pathname)
  )
}

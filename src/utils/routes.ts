/** Public marketing landing at site root (no legacy site navbar). */
export function isPublicLandingRoute(pathname: string | null): boolean {
  return pathname === "/"
}

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

/** Platform super admin workspace */
export function usesPlatformSidebar(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === "/platform" || pathname.startsWith("/platform/")
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

/** Login screen — no site header chrome */
export function isLoginRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === "/login"
}

export function hidesSiteNavBar(pathname: string | null): boolean {
  return (
    isPublicLandingRoute(pathname) ||
    isLoginRoute(pathname) ||
    isConsumerTabletRoute(pathname) ||
    isKitchenTvRoute(pathname) ||
    usesMerchantSidebar(pathname) ||
    usesPlatformSidebar(pathname)
  )
}

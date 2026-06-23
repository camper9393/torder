export const RESTAURANT_INFO_UPDATED_EVENT = "torder:restaurant-info-updated"

export function notifyRestaurantInfoUpdated(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(RESTAURANT_INFO_UPDATED_EVENT))
}

export function subscribeRestaurantInfoUpdated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(RESTAURANT_INFO_UPDATED_EVENT, handler)
  return () =>
    window.removeEventListener(RESTAURANT_INFO_UPDATED_EVENT, handler)
}

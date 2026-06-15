export const NOTIFICATIONS_REFRESH_EVENT = "torder:notifications-refresh";

export function emitNotificationsRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH_EVENT));
}

export function subscribeNotificationsRefresh(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, listener);
  return () => window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, listener);
}

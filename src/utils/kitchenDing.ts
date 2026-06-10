/** New incoming order notification — place file at public/sounds/NewOrder.wav */
export const NEW_ORDER_SOUND_SRC = "/sounds/NewOrder.wav"

export function getNewOrderSoundSrc(): string {
  if (typeof window === "undefined") return ""
  return NEW_ORDER_SOUND_SRC
}

/** @deprecated Use getNewOrderSoundSrc */
export function getKitchenDingSrc(): string {
  return getNewOrderSoundSrc()
}

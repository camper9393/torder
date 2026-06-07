import { OrderStatus } from "@/model/order"
import { getMessages, messages } from "./catalog"
import {
  Locale,
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
  LOCALES,
  Messages,
} from "./types"

export type { Locale, Messages }
export { LOCALES, LOCALE_LABELS, LOCALE_STORAGE_KEY, getMessages, messages }

export function labelOrderStatus(status: OrderStatus, locale: Locale): string {
  return getMessages(locale).orderStatus[status] ?? status
}

export function isValidLocale(value: string | null | undefined): value is Locale {
  return value === "mn" || value === "ko" || value === "en"
}

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "mn"
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isValidLocale(stored)) return stored
  } catch {
    // ignore
  }
  return "mn"
}

export function storeLocale(locale: Locale): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore
  }
}

export function localeToDateLocale(locale: Locale): string {
  if (locale === "mn") return "mn-MN"
  if (locale === "ko") return "ko-KR"
  return "en-US"
}

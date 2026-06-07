import { getMessages } from "@/utils/i18n"
import { Locale } from "@/utils/i18n/types"

const orderKey = (merchantId: string) => `tablet-order-no-${merchantId}`

export function getSessionOrderNumber(merchantId: string): number {
  if (typeof window === "undefined") return 1
  const raw = sessionStorage.getItem(orderKey(merchantId))
  const parsed = raw ? parseInt(raw, 10) : 1
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function bumpSessionOrderNumber(merchantId: string): void {
  if (typeof window === "undefined") return
  const next = getSessionOrderNumber(merchantId) + 1
  sessionStorage.setItem(orderKey(merchantId), String(next))
  window.dispatchEvent(
    new CustomEvent("tablet-order-bump", { detail: { merchantId } })
  )
}

export function formatTableLabel(tableName: string, locale: Locale = "mn"): string {
  const prefix = getMessages(locale).common.tablePrefix
  const trimmed = tableName.trim()
  const numeric = /^\d+$/.test(trimmed)
  const display = numeric ? trimmed.padStart(2, "0") : trimmed.toUpperCase()
  return `${prefix} ${display}`
}

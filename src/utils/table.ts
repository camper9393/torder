import { AppUrl } from "@/utils/constants"

export const UNKNOWN_TABLE = "Тодорхойгүй ширээ"

export function normalizeTableName(raw: string | null | undefined): string {
  const trimmed = raw?.trim()
  if (!trimmed) return UNKNOWN_TABLE
  return trimmed
}

export function parseTableFromSearchParam(
  value: string | null | undefined
): string | undefined {
  if (value == null || String(value).trim() === "") return undefined
  try {
    return normalizeTableName(decodeURIComponent(String(value)))
  } catch {
    return normalizeTableName(String(value))
  }
}

export function buildConsumerMenuUrl(
  merchantId: string,
  table: string,
  baseUrl: string = AppUrl
): string {
  const base = baseUrl.replace(/\/$/, "")
  const tableName = normalizeTableName(table)
  if (tableName === UNKNOWN_TABLE) {
    return `${base}/consumer/${merchantId}`
  }
  return `${base}/consumer/${merchantId}?table=${encodeURIComponent(tableName)}`
}

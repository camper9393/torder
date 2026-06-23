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

/** Compact table number for tablet UI (e.g. "1" from "Table 1"). */
export function displayTableNumber(tableName: string): string {
  const trimmed = tableName.trim()
  if (!trimmed || trimmed === UNKNOWN_TABLE) return "—"
  if (/^\d+$/.test(trimmed)) return trimmed
  const match = trimmed.match(/\d+/)
  if (match) return match[0]
  return trimmed.toUpperCase()
}

export function hasDisplayableTableName(tableName: string | undefined): boolean {
  const trimmed = tableName?.trim()
  return Boolean(trimmed && trimmed !== UNKNOWN_TABLE)
}

export function buildConsumerMenuUrl(
  merchantId: string,
  table: string,
  baseUrl: string = AppUrl,
  options?: {
    preview?: boolean
    uiScale?: number
    textScale?: number
    theme?: string
    cacheBust?: number
  }
): string {
  const base = baseUrl.replace(/\/$/, "")
  const tableName = normalizeTableName(table)
  const params = new URLSearchParams()

  if (tableName !== UNKNOWN_TABLE) {
    params.set("table", tableName)
  }
  if (options?.preview) {
    params.set("preview", "true")
  }
  if (options?.uiScale != null && Number.isFinite(options.uiScale)) {
    params.set("uiScale", String(options.uiScale))
  }
  if (options?.textScale != null && Number.isFinite(options.textScale)) {
    params.set("textScale", String(options.textScale))
  }
  if (options?.theme != null && options.theme.trim() !== "") {
    params.set("theme", options.theme.trim())
  }
  if (options?.cacheBust != null) {
    params.set("_t", String(options.cacheBust))
  }

  const query = params.toString()
  return query
    ? `${base}/consumer/${merchantId}?${query}`
    : `${base}/consumer/${merchantId}`
}

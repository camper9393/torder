import { UNKNOWN_TABLE, normalizeTableName } from "@/utils/table"
import { normalizeTableNameKey } from "@/utils/tableNameValidation"

export const ACTIVE_WAITER_CALL_STATUSES = ["new", "accepted"] as const

export function waiterCallTableKey(raw: string | null | undefined): string {
  return normalizeTableNameKey(normalizeTableName(raw))
}

export function isValidWaiterCallTableName(
  raw: string | null | undefined
): boolean {
  const normalized = normalizeTableName(raw)
  return normalized !== UNKNOWN_TABLE && normalized.trim().length > 0
}

export function resolveConsumerWaiterCallTableName(
  tableFromStore: string | null | undefined,
  tableFromUrl: string | null | undefined
): string | null {
  const urlTable = tableFromUrl?.trim()
    ? normalizeTableName(tableFromUrl)
    : null
  if (urlTable && urlTable !== UNKNOWN_TABLE) return urlTable

  const storeTable = normalizeTableName(tableFromStore)
  if (storeTable !== UNKNOWN_TABLE) return storeTable

  return null
}

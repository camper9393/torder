import type { FloorLayoutTable } from "@/types/floorLayout";

export const DUPLICATE_TABLE_NAME_MESSAGE =
  "Ижил нэртэй ширээ байна. Өөр нэр оруулна уу.";

/** Case-insensitive, trimmed key for uniqueness checks. */
export function normalizeTableNameKey(name: string): string {
  return name.trim().normalize("NFC").toLowerCase();
}

/** True when another table already uses this name (exact match, case-insensitive). */
export function isTableNameTaken(
  name: string,
  tables: Pick<FloorLayoutTable, "id" | "tableName">[],
  excludeId?: string
): boolean {
  const key = normalizeTableNameKey(name);
  if (!key) return false;
  return tables.some(
    (tbl) =>
      tbl.id !== excludeId && normalizeTableNameKey(tbl.tableName) === key
  );
}

export function getTableDisplayLabel(table: FloorLayoutTable): string {
  return table.displayLabel ?? table.tableName;
}

export function findDuplicateNameKeys(
  tables: Pick<FloorLayoutTable, "tableName">[]
): Set<string> {
  const counts = new Map<string, number>();
  const dupes = new Set<string>();

  for (const row of tables) {
    const key = normalizeTableNameKey(row.tableName);
    if (!key) continue;
    const next = (counts.get(key) ?? 0) + 1;
    counts.set(key, next);
    if (next > 1) dupes.add(key);
  }

  return dupes;
}

export function hasDuplicateTableNames(
  tables: Pick<FloorLayoutTable, "tableName">[]
): boolean {
  return findDuplicateNameKeys(tables).size > 0;
}

export function validateUniqueTableNames(
  tables: Pick<FloorLayoutTable, "tableName">[]
): { ok: true } | { ok: false; message: string } {
  for (const row of tables) {
    if (!row.tableName.trim()) {
      return { ok: false, message: DUPLICATE_TABLE_NAME_MESSAGE };
    }
  }

  if (hasDuplicateTableNames(tables)) {
    return { ok: false, message: DUPLICATE_TABLE_NAME_MESSAGE };
  }

  return { ok: true };
}

/** Disambiguate UI labels when DB already has duplicate names (does not change tableName). */
export function applyDuplicateDisplayLabels(
  tables: FloorLayoutTable[]
): FloorLayoutTable[] {
  const byKey = new Map<string, FloorLayoutTable[]>();

  for (const table of tables) {
    const key = normalizeTableNameKey(table.tableName);
    const group = byKey.get(key) ?? [];
    group.push(table);
    byKey.set(key, group);
  }

  return tables.map((table) => {
    const key = normalizeTableNameKey(table.tableName);
    const group = byKey.get(key) ?? [table];

    if (group.length <= 1) {
      return {
        ...table,
        displayLabel: undefined,
        hasDuplicateName: false,
      };
    }

    const index = group.findIndex((t) => t.id === table.id);
    const safeIndex = index >= 0 ? index : 0;

    return {
      ...table,
      displayLabel:
        safeIndex === 0
          ? table.tableName
          : `${table.tableName} (${safeIndex + 1})`,
      hasDuplicateName: true,
    };
  });
}

export function createPendingTableId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `pending-${crypto.randomUUID()}`;
  }
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function isPendingTableId(id: string): boolean {
  return id.startsWith("pending-");
}

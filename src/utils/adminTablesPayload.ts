import type { TableHall } from "@/types/floorLayout";
import type { TableSummary } from "@/types/table";
import { defaultHall } from "@/utils/tableHalls";

export function parseAdminTablesPayload(data: unknown): {
  halls: TableHall[];
  tables: TableSummary[];
} {
  if (Array.isArray(data)) {
    return { halls: [defaultHall()], tables: data as TableSummary[] };
  }

  if (data && typeof data === "object" && "tables" in data) {
    const payload = data as { halls?: TableHall[]; tables?: TableSummary[] };
    return {
      halls:
        Array.isArray(payload.halls) && payload.halls.length > 0
          ? payload.halls
          : [defaultHall()],
      tables: Array.isArray(payload.tables) ? payload.tables : [],
    };
  }

  return { halls: [defaultHall()], tables: [] };
}

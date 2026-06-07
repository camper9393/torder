import type { FloorLayoutTable } from "@/types/floorLayout";
import { clampFloorLayoutTable } from "@/utils/floorLayout";

export function snapshotFloorLayouts(tables: FloorLayoutTable[]): string {
  const normalized = tables
    .map(clampFloorLayoutTable)
    .sort((a, b) => a.id.localeCompare(b.id));
  return JSON.stringify(normalized);
}

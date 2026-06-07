import type { FloorLayoutTable, FloorLayoutPayload, TableHall, TableShape } from "@/types/floorLayout";

import {

  buildDefaultTableLayout,

  clampLayoutRect,

  FLOOR_LAYOUT_SLIDER_MIN,

  FLOOR_PLAN_DEFAULT_HEIGHT,

  FLOOR_PLAN_DEFAULT_WIDTH,

  isTakeoutTableName,

  normalizeLayoutRect,

  type TableLayoutRect,

} from "@/utils/tableFloorPlan";

import {

  applyDuplicateDisplayLabels,

  createPendingTableId,

  normalizeTableNameKey,

} from "@/utils/tableNameValidation";

import { resolveHallId, defaultHall } from "@/utils/tableHalls";



export const DEFAULT_TABLE_COLOR = "#4A7FE5";

export const FLOOR_LAYOUT_SIZE_MIN = 10;

export const FLOOR_LAYOUT_SIZE_MAX = 40;

export { FLOOR_LAYOUT_SLIDER_MIN } from "@/utils/tableFloorPlan";

const SLIDER_RANGE = 100 - FLOOR_LAYOUT_SLIDER_MIN;



export function normalizeShape(shape: unknown): TableShape {

  if (shape === "circle" || shape === "round") return "circle";

  return "rectangle";

}



/** Force equal width/height for circle tables (load, save, resize). */

export function normalizeCircleDimensions(

  width: number,

  height: number

): { width: number; height: number } {

  const size = Math.max(width, height);

  return { width: size, height: size };

}



export function clampFloorLayoutTable(

  table: FloorLayoutTable

): FloorLayoutTable {

  const rect = clampLayoutRect({

    tableName: table.tableName,

    x: table.x,

    y: table.y,

    width: table.width,

    height: table.height,

  });



  const shape = normalizeShape(table.shape);

  let { width, height } = rect;

  if (shape === "circle") {

    ({ width, height } = normalizeCircleDimensions(width, height));

  }



  const clamped = clampLayoutRect({

    tableName: table.tableName,

    x: rect.x,

    y: rect.y,

    width,

    height,

  });



  return {

    id: table.id,

    tableName: table.tableName.trim(),

    hallId: resolveHallId(table.hallId),

    displayLabel: table.displayLabel,

    hasDuplicateName: table.hasDuplicateName,

    description: table.description ?? "",

    shape,

    x: clamped.x,

    y: clamped.y,

    width: clamped.width,

    height: clamped.height,

  };

}



export function rectToFloorLayout(

  rect: TableLayoutRect,

  partial?: Partial<FloorLayoutTable>

): FloorLayoutTable {

  return clampFloorLayoutTable({

    id: partial?.id ?? createPendingTableId(),

    tableName: rect.tableName,

    description: partial?.description ?? "",

    shape: partial?.shape ?? "rectangle",

    displayLabel: partial?.displayLabel,

    hasDuplicateName: partial?.hasDuplicateName,

    x: rect.x,

    y: rect.y,

    width: rect.width,

    height: rect.height,

  });

}



export function layoutDocToFloorTable(doc: {

  id?: string;

  _id?: unknown;

  tableName: string;

  hallId?: string | null;

  description?: string;

  shape?: string;

  x: number;

  y: number;

  width: number;

  height: number;

}): FloorLayoutTable {

  const id =

    doc.id ??

    (doc._id != null ? String(doc._id) : createPendingTableId());



  return clampFloorLayoutTable({

    id,

    tableName: doc.tableName,

    hallId: resolveHallId(doc.hallId),

    description: doc.description ?? "",

    shape: normalizeShape(doc.shape),

    x: doc.x,

    y: doc.y,

    width: doc.width,

    height: doc.height,

  });

}



export function mergeFloorLayouts(

  tableNames: string[],

  saved: FloorLayoutTable[]

): FloorLayoutTable[] {

  const result: FloorLayoutTable[] = saved.map((t) =>

    clampFloorLayoutTable({

      ...t,

      id: t.id || createPendingTableId(),

    })

  );



  const coveredKeys = new Set(

    result.map((t) => normalizeTableNameKey(t.tableName))

  );



  const defaultRects = buildDefaultTableLayout(tableNames);

  const defaultByName = new Map(defaultRects.map((r) => [r.tableName, r]));



  for (const tableName of tableNames) {

    const key = normalizeTableNameKey(tableName);

    if (coveredKeys.has(key)) continue;



    const fallback = defaultByName.get(tableName);

    if (fallback) {

      result.push(

        rectToFloorLayout(fallback, {

          shape: isTakeoutTableName(tableName) ? "rectangle" : "rectangle",

        })

      );

    } else {

      result.push(

        clampFloorLayoutTable({

          id: createPendingTableId(),

          tableName,

          description: "",

          shape: "rectangle",

          x: 5,

          y: 8,

          width: FLOOR_PLAN_DEFAULT_WIDTH,

          height: FLOOR_PLAN_DEFAULT_HEIGHT,

        })

      );

    }

    coveredKeys.add(key);

  }



  return applyDuplicateDisplayLabels(result);

}



export function nextDefaultTableName(existing: string[]): string {

  const keys = new Set(existing.map(normalizeTableNameKey));

  let max = 0;

  for (const name of existing) {

    const m = /^(?:table|ширээ)\s*(\d+)$/i.exec(name.trim());

    if (m) max = Math.max(max, parseInt(m[1], 10));

  }



  let n = max + 1;

  while (keys.has(normalizeTableNameKey(`Table ${n}`))) {

    n += 1;

  }

  return `Table ${n}`;

}



export function createDefaultFloorTable(

  tableName: string,

  index: number,

  existingNames: string[] = [],

  id?: string

): FloorLayoutTable {

  const names = [...existingNames, tableName];

  const layouts = buildDefaultTableLayout(names);

  const rect =

    layouts.find((r) => r.tableName === tableName) ??

    layouts[layouts.length - 1];

  return clampFloorLayoutTable({

    id: id ?? createPendingTableId(),

    tableName,

    description: tableName,

    shape: "rectangle",

    x: rect?.x ?? 4,

    y: rect?.y ?? 8,

    width: rect?.width ?? FLOOR_PLAN_DEFAULT_WIDTH,

    height: rect?.height ?? FLOOR_PLAN_DEFAULT_HEIGHT,

  });

}



/** Map size slider (8–100) to width/height percent for the shape. */

export function sizeSliderToDimensions(

  shape: TableShape,

  slider: number

): { width: number; height: number } {

  const s = Math.min(100, Math.max(FLOOR_LAYOUT_SLIDER_MIN, slider));

  const t = (s - FLOOR_LAYOUT_SLIDER_MIN) / SLIDER_RANGE;

  const span = FLOOR_LAYOUT_SIZE_MAX - FLOOR_LAYOUT_SIZE_MIN;

  const base = FLOOR_LAYOUT_SIZE_MIN + t * span;

  if (shape === "rectangle") {

    return {

      width: Math.round(base * 1.15 * 10) / 10,

      height: Math.round(base * 10) / 10,

    };

  }

  const side = Math.round(base * 10) / 10;

  return { width: side, height: side };

}



export function dimensionsToSizeSlider(

  shape: TableShape,

  width: number,

  height: number

): number {

  const span = FLOOR_LAYOUT_SIZE_MAX - FLOOR_LAYOUT_SIZE_MIN;

  const ref =

    shape === "rectangle" ? (width / 1.15 + height) / 2 : Math.max(width, height);

  if (ref <= FLOOR_LAYOUT_SIZE_MIN) {
    return FLOOR_LAYOUT_SLIDER_MIN;
  }

  const t = (ref - FLOOR_LAYOUT_SIZE_MIN) / span;

  const slider = FLOOR_LAYOUT_SLIDER_MIN + t * SLIDER_RANGE;

  return Math.round(Math.min(100, Math.max(FLOOR_LAYOUT_SLIDER_MIN, slider)));

}



export function normalizeLegacyLayoutRow(

  row: Record<string, unknown>

): FloorLayoutTable | null {

  const tableName =

    typeof row.tableName === "string" ? row.tableName.trim() : "";

  if (!tableName) return null;



  const idRaw = row.id ?? row._id;

  const id =

    typeof idRaw === "string"

      ? idRaw

      : idRaw != null

        ? String(idRaw)

        : createPendingTableId();



  const rect = normalizeLayoutRect({

    tableName,

    x: Number(row.x),

    y: Number(row.y),

    width: Number(row.width),

    height: Number(row.height),

  });



  return clampFloorLayoutTable({

    id,

    tableName,

    hallId: resolveHallId(

      typeof row.hallId === "string" ? row.hallId : undefined

    ),

    description: typeof row.description === "string" ? row.description : "",

    shape: normalizeShape(row.shape),

    x: rect.x,

    y: rect.y,

    width: rect.width,

    height: rect.height,

  });

}

export function parseFloorLayoutPayload(data: unknown): FloorLayoutPayload {
  if (Array.isArray(data)) {
    return {
      halls: [defaultHall()],
      layouts: applyDuplicateDisplayLabels(
        data.map((row) => clampFloorLayoutTable(row as FloorLayoutTable))
      ),
    };
  }

  if (data && typeof data === "object" && "layouts" in data) {
    const payload = data as FloorLayoutPayload;
    const layouts = Array.isArray(payload.layouts) ? payload.layouts : [];
    const halls =
      Array.isArray(payload.halls) && payload.halls.length > 0
        ? payload.halls
        : [defaultHall()];

    return {
      halls,
      layouts: applyDuplicateDisplayLabels(
        layouts.map((row) => clampFloorLayoutTable(row))
      ),
    };
  }

  return { halls: [defaultHall()], layouts: [] };
}

export function filterTablesByHall<T extends { layout?: FloorLayoutTable }>(
  rows: T[],
  hallId: string
): T[] {
  const activeHallId = resolveHallId(hallId);
  return rows.filter(
    (row) => resolveHallId(row.layout?.hallId) === activeHallId
  );
}

export function filterFloorLayoutsByHall(
  layouts: FloorLayoutTable[],
  hallId: string
): FloorLayoutTable[] {
  const activeHallId = resolveHallId(hallId);
  return layouts.filter(
    (layout) => resolveHallId(layout.hallId) === activeHallId
  );
}

export function mergeHallLayouts(
  allTables: FloorLayoutTable[],
  hallId: string,
  hallTables: FloorLayoutTable[]
): FloorLayoutTable[] {
  const activeHallId = resolveHallId(hallId);
  const other = allTables.filter(
    (table) => resolveHallId(table.hallId) !== activeHallId
  );
  return applyDuplicateDisplayLabels([
    ...other,
    ...hallTables.map((table) =>
      clampFloorLayoutTable({ ...table, hallId: activeHallId })
    ),
  ]);
}


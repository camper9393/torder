export type TableLayoutRect = {
  tableName: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Layout coordinates are percentages (0–100) of the floor canvas. */
export const FLOOR_PLAN_DEFAULT_WIDTH = 17;
export const FLOOR_PLAN_DEFAULT_HEIGHT = 19;
/** Size slider minimum (editor + display). */
export const FLOOR_LAYOUT_SLIDER_MIN = 8;
/** Min layout % at slider 8 — rectangle (base 10 × 1.15). */
export const FLOOR_PLAN_MIN_WIDTH = 11.5;
export const FLOOR_PLAN_MIN_HEIGHT = 10;
export const FLOOR_PLAN_MAX_WIDTH = 42;
export const FLOOR_PLAN_MAX_HEIGHT = 45;

/** ~220×160px at a typical 85%-width floor (~1300×850). */
export const FLOOR_PLAN_REF_WIDTH_PX = 1320;
export const FLOOR_PLAN_REF_HEIGHT_PX = 850;

const VIRTUAL_WIDTH = 3000;
const VIRTUAL_HEIGHT = 2000;

/** Default grid for reset layout (converted to % via ref canvas size). */
export const RESET_LAYOUT_TABLE_WIDTH_PX = 140;
export const RESET_LAYOUT_TABLE_HEIGHT_PX = 100;
export const RESET_LAYOUT_GAP_PX = 24;
export const RESET_LAYOUT_PADDING_PX = 16;
export const RESET_LAYOUT_COLS_PER_ROW = 4;

function pxToPercentX(px: number): number {
  return (px / FLOOR_PLAN_REF_WIDTH_PX) * 100;
}

function pxToPercentY(px: number): number {
  return (px / FLOOR_PLAN_REF_HEIGHT_PX) * 100;
}

function chooseColumnCount(
  count: number,
  w: number,
  h: number,
  gapX: number,
  gapY: number,
  padX: number,
  padY: number,
  preferredCols: number
): number {
  const maxColsByWidth = Math.max(
    1,
    Math.floor((100 - 2 * padX + gapX) / (w + gapX))
  );
  const maxCols = Math.min(count, maxColsByWidth);

  for (let cols = Math.min(preferredCols, maxCols); cols <= maxCols; cols++) {
    const rows = Math.ceil(count / cols);
    const totalH = 2 * padY + rows * h + Math.max(0, rows - 1) * gapY;
    if (totalH <= 100) return cols;
  }

  return maxCols;
}

function scaleGridToFitHeight(
  count: number,
  cols: number,
  w: number,
  h: number,
  gapX: number,
  gapY: number,
  padY: number
): { w: number; h: number; gapX: number; gapY: number } {
  const rows = Math.ceil(count / cols);
  const totalH = 2 * padY + rows * h + Math.max(0, rows - 1) * gapY;
  if (totalH <= 100) return { w, h, gapX, gapY };

  const innerH = 100 - 2 * padY - Math.max(0, rows - 1) * gapY;
  const scale = innerH / (rows * h);
  return {
    w: w * scale,
    h: h * scale,
    gapX: gapX * scale,
    gapY: gapY * scale,
  };
}

export function isTakeoutTableName(name: string): boolean {
  return /takeout|to[\s-]?go|take[\s-]?away|авч\s*явах|авчих|багц|parcel|delivery/i.test(
    name
  );
}

export function isStoredAsVirtualPixels(rect: TableLayoutRect): boolean {
  return (
    rect.x > 100 ||
    rect.y > 100 ||
    rect.width > FLOOR_PLAN_MAX_WIDTH ||
    rect.height > FLOOR_PLAN_MAX_HEIGHT
  );
}

export function virtualPixelsToPercent(rect: TableLayoutRect): TableLayoutRect {
  return {
    tableName: rect.tableName,
    x: (rect.x / VIRTUAL_WIDTH) * 100,
    y: (rect.y / VIRTUAL_HEIGHT) * 100,
    width: (rect.width / VIRTUAL_WIDTH) * 100,
    height: (rect.height / VIRTUAL_HEIGHT) * 100,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function clampLayoutRect(rect: TableLayoutRect): TableLayoutRect {
  const width = clamp(rect.width, FLOOR_PLAN_MIN_WIDTH, FLOOR_PLAN_MAX_WIDTH);
  const height = clamp(
    rect.height,
    FLOOR_PLAN_MIN_HEIGHT,
    FLOOR_PLAN_MAX_HEIGHT
  );
  const x = clamp(rect.x, 0, 100 - width);
  const y = clamp(rect.y, 0, 100 - height);
  return { ...rect, x, y, width, height };
}

export function normalizeLayoutRect(rect: TableLayoutRect): TableLayoutRect {
  const base = isStoredAsVirtualPixels(rect)
    ? virtualPixelsToPercent(rect)
    : rect;
  return clampLayoutRect(base);
}

/**
 * Neat grid layout (percent of floor): sorted names, up to 4 per row,
 * fixed px gaps/sizes on the reference canvas, scaled down if needed to fit.
 */
export function buildDefaultTableLayout(
  tableNames: string[]
): TableLayoutRect[] {
  const sorted = [...tableNames].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  if (sorted.length === 0) return [];

  const padX = pxToPercentX(RESET_LAYOUT_PADDING_PX);
  const padY = pxToPercentY(RESET_LAYOUT_PADDING_PX);
  let w = pxToPercentX(RESET_LAYOUT_TABLE_WIDTH_PX);
  let h = pxToPercentY(RESET_LAYOUT_TABLE_HEIGHT_PX);
  let gapX = pxToPercentX(RESET_LAYOUT_GAP_PX);
  let gapY = pxToPercentY(RESET_LAYOUT_GAP_PX);

  const cols = chooseColumnCount(
    sorted.length,
    w,
    h,
    gapX,
    gapY,
    padX,
    padY,
    RESET_LAYOUT_COLS_PER_ROW
  );

  const scaled = scaleGridToFitHeight(
    sorted.length,
    cols,
    w,
    h,
    gapX,
    gapY,
    padY
  );
  w = scaled.w;
  h = scaled.h;
  gapX = scaled.gapX;
  gapY = scaled.gapY;

  return sorted.map((tableName, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padX + col * (w + gapX);
    const y = padY + row * (h + gapY);
    return clampLayoutRect({ tableName, x, y, width: w, height: h });
  });
}

export function mergeTableLayouts(
  tableNames: string[],
  saved: TableLayoutRect[]
): TableLayoutRect[] {
  const byName = new Map(
    saved.map((r) => [r.tableName, normalizeLayoutRect(r)])
  );
  const defaults = buildDefaultTableLayout(tableNames);
  const defaultByName = new Map(defaults.map((r) => [r.tableName, r]));

  return tableNames.map((tableName) => {
    const existing = byName.get(tableName);
    if (existing) return existing;
    const fallback = defaultByName.get(tableName);
    if (fallback) return fallback;
    return clampLayoutRect({
      tableName,
      x: 5,
      y: 8,
      width: FLOOR_PLAN_DEFAULT_WIDTH,
      height: FLOOR_PLAN_DEFAULT_HEIGHT,
    });
  });
}

export function layoutMapFromList(
  layouts: TableLayoutRect[]
): Record<string, TableLayoutRect> {
  return Object.fromEntries(layouts.map((l) => [l.tableName, l]));
}

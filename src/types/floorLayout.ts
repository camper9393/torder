export type TableShape = "rectangle" | "circle";

export type FloorLayoutTable = {
  /** MongoDB _id or client pending id until saved. */
  id: string;
  tableName: string;
  /** Hall this table belongs to (defaults to hall-1). */
  hallId?: string;
  /** Shown on canvas when DB has duplicate names (e.g. "Take (2)"). */
  displayLabel?: string;
  /** True when loaded duplicates must be renamed before save. */
  hasDuplicateName?: boolean;
  description: string;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TableHall = {
  id: string;
  name: string;
};

export type FloorLayoutPayload = {
  halls: TableHall[];
  layouts: FloorLayoutTable[];
};

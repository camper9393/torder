import mongoose from "mongoose";

export type TableShape = "rectangle" | "circle";

export interface ITableLayout {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  tableName: string;
  normalizedTableName: string;
  description: string;
  shape: TableShape;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Hall id; missing on legacy rows means default hall (hall-1). */
  hallId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tableLayoutSchema = new mongoose.Schema<ITableLayout>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: true,
      index: true,
    },
    tableName: { type: String, required: true, trim: true },
    normalizedTableName: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    shape: {
      type: String,
      enum: ["rectangle", "circle", "square", "round"],
      default: "rectangle",
    },
    color: { type: String, default: "#4A7FE5" },
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
    width: { type: Number, required: true, min: 4, max: 100 },
    height: { type: Number, required: true, min: 4, max: 100 },
    hallId: { type: String, default: "hall-1", trim: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

tableLayoutSchema.index(
  { merchantId: 1, normalizedTableName: 1 },
  { unique: true }
);

tableLayoutSchema.pre("validate", function setNormalizedTableName() {
  if (typeof this.tableName === "string") {
    this.normalizedTableName = this.tableName.trim().toLowerCase();
  }
});

export const TableLayout =
  mongoose.models.table_layouts ||
  mongoose.model<ITableLayout>("table_layouts", tableLayoutSchema);

import mongoose from "mongoose";

export interface ITableHall {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  hallId: string;
  name: string;
  sortOrder: number;
  /** Soft-delete timestamp; null = visible/active. */
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const tableHallSchema = new mongoose.Schema<ITableHall>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: true,
      index: true,
    },
    hallId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

tableHallSchema.index({ merchantId: 1, hallId: 1 }, { unique: true });

export const TableHall =
  mongoose.models.table_halls ||
  mongoose.model<ITableHall>("table_halls", tableHallSchema);

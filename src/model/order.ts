import mongoose from "mongoose";

export type OrderStatus =
  | "new"
  | "accepted"
  | "cooking"
  | "done"
  | "closed";

export interface IOrderItem {
  menuItemId?: mongoose.Types.ObjectId;
  title: string;
  nameMn?: string;
  nameEn?: string;
  selectedSizeLabelMn?: string;
  selectedSizeLabelEn?: string;
  price: number;
  quantity: number;
  image?: string;
  /** Waiter marked this line as delivered to the table */
  served?: boolean;
}

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  tableName: string;
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new mongoose.Schema<IOrderItem>(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "menus" },
    title: { type: String, required: true },
    nameMn: { type: String, trim: true },
    nameEn: { type: String, trim: true },
    selectedSizeLabelMn: { type: String, trim: true },
    selectedSizeLabelEn: { type: String, trim: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    served: { type: Boolean, default: false },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema<IOrder>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "merchants",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: false,
    },
    tableName: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["new", "accepted", "cooking", "done", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

export const Order =
  mongoose.models.orders || mongoose.model<IOrder>("orders", orderSchema);

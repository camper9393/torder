import mongoose from "mongoose";

export type OrderStatus =
  | "new"
  | "accepted"
  | "cooking"
  | "done"
  | "closed";

export type RefundStatus = "none" | "partial" | "full";

export interface IRefundedLineItem {
  lineIndex: number;
  menuItemId?: mongoose.Types.ObjectId;
  title: string;
  quantityRefunded: number;
  amountRefunded: number;
}

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
  restaurantId?: mongoose.Types.ObjectId;
  /** YYMMDDHHmm + 2 оронт sequence (жишээ: 260617064201) */
  orderNo?: string;
  userId?: mongoose.Types.ObjectId;
  tableName: string;
  items: IOrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  paidAmount?: number;
  vatType?: string;
  guestCount?: number;
  discountAmount?: number;
  changeAmount?: number;
  paidAt?: Date;
  refundStatus?: RefundStatus;
  refundedAmount?: number;
  refundedItems?: IRefundedLineItem[];
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
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      index: true,
    },
    orderNo: {
      type: String,
      trim: true,
      index: true,
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
    paymentMethod: { type: String, trim: true },
    paidAmount: { type: Number, min: 0 },
    vatType: { type: String, trim: true },
    guestCount: { type: Number, min: 1 },
    discountAmount: { type: Number, min: 0, default: 0 },
    changeAmount: { type: Number, min: 0, default: 0 },
    paidAt: { type: Date },
    refundStatus: {
      type: String,
      enum: ["none", "partial", "full"],
      default: "none",
    },
    refundedAmount: { type: Number, default: 0, min: 0 },
    refundedItems: {
      type: [
        {
          lineIndex: { type: Number, required: true, min: 0 },
          menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "menus" },
          title: { type: String, required: true, trim: true },
          quantityRefunded: { type: Number, required: true, min: 0 },
          amountRefunded: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

orderSchema.index(
  { merchantId: 1, orderNo: 1 },
  {
    unique: true,
    partialFilterExpression: {
      orderNo: { $type: "string" },
    },
  }
);

/** Next.js hot reload: хуучин schema cache orderNo-г strict mode-оор устгана */
function staleOrdersModel(): boolean {
  const existing = mongoose.models.orders;
  if (!existing) return false;
  const schema = existing.schema;
  return !schema.path("restaurantId") || !schema.path("orderNo");
}

if (staleOrdersModel()) {
  mongoose.deleteModel("orders");
}

export const Order =
  mongoose.models.orders || mongoose.model<IOrder>("orders", orderSchema);

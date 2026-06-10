import mongoose from "mongoose";

export type RefundType = "full" | "partial";

export type RefundReason =
  | "customer_cancelled"
  | "wrong_item"
  | "item_unavailable"
  | "quality_issue"
  | "staff_mistake"
  | "other";

export interface IRefundItem {
  lineIndex: number;
  menuItemId?: mongoose.Types.ObjectId;
  title: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  returnToInventory: boolean;
}

export interface IRefund {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  tableName: string;
  items: IRefundItem[];
  refundAmount: number;
  reason: RefundReason;
  refundType: RefundType;
  paymentMethod: string;
  createdBy: mongoose.Types.ObjectId;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refundItemSchema = new mongoose.Schema<IRefundItem>(
  {
    lineIndex: { type: Number, required: true, min: 0 },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "menus" },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
    returnToInventory: { type: Boolean, default: false },
  },
  { _id: false }
);

const refundSchema = new mongoose.Schema<IRefund>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: true,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      required: true,
      index: true,
    },
    tableName: { type: String, required: true, trim: true },
    items: { type: [refundItemSchema], required: true },
    refundAmount: { type: Number, required: true, min: 0 },
    reason: {
      type: String,
      enum: [
        "customer_cancelled",
        "wrong_item",
        "item_unavailable",
        "quality_issue",
        "staff_mistake",
        "other",
      ],
      required: true,
    },
    refundType: {
      type: String,
      enum: ["full", "partial"],
      required: true,
    },
    paymentMethod: { type: String, required: true, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: true,
    },
    createdByName: { type: String, trim: true },
  },
  { timestamps: true, versionKey: false }
);

refundSchema.index({ merchantId: 1, createdAt: -1 });
refundSchema.index({ merchantId: 1, orderId: 1, createdAt: -1 });

export const Refund =
  mongoose.models.refunds || mongoose.model<IRefund>("refunds", refundSchema);

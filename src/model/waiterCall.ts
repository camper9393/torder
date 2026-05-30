import mongoose from "mongoose";

export type WaiterCallType = "waiter_call";
export type WaiterCallStatus = "new" | "accepted" | "done";

export interface IWaiterCall {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  tableName: string;
  type: WaiterCallType;
  status: WaiterCallStatus;
  createdAt: Date;
  updatedAt: Date;
}

const waiterCallSchema = new mongoose.Schema<IWaiterCall>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "merchants",
    },
    tableName: { type: String, required: true },
    type: {
      type: String,
      enum: ["waiter_call"],
      default: "waiter_call",
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "accepted", "done"],
      default: "new",
    },
  },
  { timestamps: true }
);

export const WaiterCall =
  mongoose.models.waiter_calls ||
  mongoose.model<IWaiterCall>("waiter_calls", waiterCallSchema);

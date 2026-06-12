import mongoose from "mongoose";
import { RestaurantPlan } from "@/model/restaurant";

export enum PlatformPaymentStatus {
  PAID = "paid",
  PENDING = "pending",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
}

export enum PlatformPaymentMethod {
  MANUAL = "manual",
  BANK = "bank",
  CASH = "cash",
  CARD = "card",
  OTHER = "other",
}

export interface IPlatformPayment {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  plan: RestaurantPlan;
  status: PlatformPaymentStatus;
  paymentMethod: PlatformPaymentMethod;
  paidAt?: Date;
  dueDate: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const platformPaymentSchema = new mongoose.Schema<IPlatformPayment>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "MNT", trim: true },
    plan: {
      type: String,
      required: true,
      enum: Object.values(RestaurantPlan),
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(PlatformPaymentStatus),
      default: PlatformPaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: Object.values(PlatformPaymentMethod),
      default: PlatformPaymentMethod.MANUAL,
    },
    paidAt: { type: Date },
    dueDate: { type: Date, required: true },
    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

platformPaymentSchema.index({ status: 1, dueDate: 1 });

export const PlatformPayment =
  mongoose.models.platform_payments ||
  mongoose.model<IPlatformPayment>("platform_payments", platformPaymentSchema);

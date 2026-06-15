import mongoose from "mongoose";

export enum NotificationType {
  SUPPORT_NEW = "support.new_request",
  SUPPORT_REPLY = "support.reply",
  SYSTEM_SUBSCRIPTION = "system.subscription_expiring",
  SYSTEM_PAYMENT = "system.payment_received",
  SYSTEM_RESTAURANT = "system.restaurant_registered",
  SYSTEM_ERROR = "system.error",
  ORDER = "order",
}

export interface INotification {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  restaurantId?: mongoose.Types.ObjectId;
  type: NotificationType | string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      index: true,
    },
    type: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification =
  mongoose.models.notifications ||
  mongoose.model<INotification>("notifications", notificationSchema);

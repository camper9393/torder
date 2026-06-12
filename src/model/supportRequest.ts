import mongoose from "mongoose";

export enum SupportType {
  QUESTION = "question",
  PAYMENT = "payment",
  TECHNICAL = "technical",
  BUG = "bug",
  FEATURE = "feature",
  OTHER = "other",
}

export enum SupportPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum SupportStatus {
  NEW = "new",
  IN_PROGRESS = "inProgress",
  WAITING = "waiting",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export interface ISupportRequest {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: SupportType;
  priority: SupportPriority;
  status: SupportStatus;
  createdBy?: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supportRequestSchema = new mongoose.Schema<ISupportRequest>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(SupportType),
      default: SupportType.QUESTION,
    },
    priority: {
      type: String,
      required: true,
      enum: Object.values(SupportPriority),
      default: SupportPriority.MEDIUM,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(SupportStatus),
      default: SupportStatus.NEW,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    adminNote: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

supportRequestSchema.index({ status: 1, priority: 1 });

export const SupportRequest =
  mongoose.models.support_requests ||
  mongoose.model<ISupportRequest>("support_requests", supportRequestSchema);

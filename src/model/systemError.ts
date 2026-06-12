import mongoose from "mongoose";

export enum SystemErrorLevel {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

export interface ISystemError {
  _id: mongoose.Types.ObjectId;
  restaurantId?: mongoose.Types.ObjectId;
  level: SystemErrorLevel;
  source: string;
  message: string;
  stack?: string;
  url?: string;
  userId?: mongoose.Types.ObjectId;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const systemErrorSchema = new mongoose.Schema<ISystemError>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      index: true,
    },
    level: {
      type: String,
      required: true,
      enum: Object.values(SystemErrorLevel),
      default: SystemErrorLevel.ERROR,
    },
    source: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    stack: { type: String },
    url: { type: String, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

systemErrorSchema.index({ level: 1, resolved: 1, createdAt: -1 });

export const SystemError =
  mongoose.models.system_errors ||
  mongoose.model<ISystemError>("system_errors", systemErrorSchema);

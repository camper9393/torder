import mongoose from "mongoose";
import { UserRole } from "@/constants/userRoles";

export interface IActivityLog {
  _id: mongoose.Types.ObjectId;
  actorUserId?: mongoose.Types.ObjectId;
  actorRole?: UserRole;
  restaurantId?: mongoose.Types.ObjectId;
  action: string;
  module?: string;
  targetType?: string;
  targetId?: string;
  message: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  device?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new mongoose.Schema<IActivityLog>(
  {
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    actorRole: { type: String, enum: Object.values(UserRole) },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      index: true,
    },
    action: { type: String, required: true, trim: true, index: true },
    module: { type: String, trim: true, index: true },
    targetType: { type: String, trim: true },
    targetId: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    oldValue: { type: String, default: "", trim: true },
    newValue: { type: String, default: "", trim: true },
    ipAddress: { type: String, default: "", trim: true },
    device: { type: String, default: "", trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

export const ActivityLog =
  mongoose.models.activity_logs ||
  mongoose.model<IActivityLog>("activity_logs", activityLogSchema);

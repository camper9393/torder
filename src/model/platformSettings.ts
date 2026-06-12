import mongoose from "mongoose";
import { RestaurantPlan } from "@/model/restaurant";

export interface IPlatformSettings {
  _id: mongoose.Types.ObjectId;
  platformName: string;
  supportEmail: string;
  defaultTrialDays: number;
  defaultMaxTables: number;
  defaultMaxUsers: number;
  defaultPlan: RestaurantPlan;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const platformSettingsSchema = new mongoose.Schema<IPlatformSettings>(
  {
    platformName: { type: String, default: "TOrderPro", trim: true },
    supportEmail: {
      type: String,
      default: "support@torderpro.local",
      trim: true,
      lowercase: true,
    },
    defaultTrialDays: { type: Number, default: 30, min: 1 },
    defaultMaxTables: { type: Number, default: 30, min: 1 },
    defaultMaxUsers: { type: Number, default: 10, min: 1 },
    defaultPlan: {
      type: String,
      enum: Object.values(RestaurantPlan),
      default: RestaurantPlan.BUSINESS,
    },
    currency: { type: String, default: "MNT", trim: true },
  },
  { timestamps: true }
);

export const PlatformSettings =
  mongoose.models.platform_settings ||
  mongoose.model<IPlatformSettings>("platform_settings", platformSettingsSchema);

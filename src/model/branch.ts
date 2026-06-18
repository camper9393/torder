import mongoose from "mongoose";

export enum BranchStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface IBranch {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  description: string;
  status: BranchStatus;
  createdAt: Date;
  updatedAt: Date;
}

const branchSchema = new mongoose.Schema<IBranch>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    manager: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: Object.values(BranchStatus),
      default: BranchStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

branchSchema.index({ restaurantId: 1, name: 1 });

export const Branch =
  mongoose.models.branches ||
  mongoose.model<IBranch>("branches", branchSchema);

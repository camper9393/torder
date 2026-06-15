import mongoose from "mongoose";
import { UserRole } from "@/constants/userRoles";

export { UserRole };

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  restaurantId?: mongoose.Types.ObjectId;
  permissions: string[];
  isActive: boolean;
  passcodeHash?: string;
  passcodeEnabled?: boolean;
  passcodeUpdatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      required: function (this: IUser) {
        return this.role !== UserRole.PLATFORM_OWNER;
      },
      index: true,
    },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    passcodeHash: { type: String, select: false },
    passcodeEnabled: { type: Boolean, default: false },
    passcodeUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

export const User =
  mongoose.models.users || mongoose.model<IUser>("users", userSchema);

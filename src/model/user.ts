import mongoose from "mongoose";

export enum UserRole {
  PLATFORM_OWNER = "platformOwner",
  RESTAURANT_OWNER = "restaurantOwner",
  MANAGER = "manager",
  CASHIER = "cashier",
  WAITER = "waiter",
  KITCHEN = "kitchen",
}

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
      ref: "merchants",
      required: function (this: IUser) {
        return this.role !== UserRole.PLATFORM_OWNER;
      },
    },
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ restaurantId: 1 });
userSchema.index({ role: 1 });

export const User =
  mongoose.models.users || mongoose.model<IUser>("users", userSchema);

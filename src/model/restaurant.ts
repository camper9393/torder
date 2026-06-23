import mongoose from "mongoose";

export enum RestaurantPlan {
  STARTER = "starter",
  BUSINESS = "business",
  ENTERPRISE = "enterprise",
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  SUSPENDED = "suspended",
}

export interface IRestaurant {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  ownerName: string;
  email: string;
  phone: string;
  phone2: string;
  address: string;
  englishName: string;
  logoUrl: string;
  businessType: string;
  description: string;
  detailDescription: string;
  website: string;
  facebook: string;
  instagram: string;
  googleMapLink: string;
  plan: RestaurantPlan;
  subscriptionStatus: SubscriptionStatus;
  startDate: Date;
  expireDate: Date;
  maxTables: number;
  maxUsers: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new mongoose.Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    phone2: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    englishName: { type: String, default: "", trim: true },
    logoUrl: { type: String, default: "", trim: true },
    businessType: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    detailDescription: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    googleMapLink: { type: String, default: "", trim: true },
    plan: {
      type: String,
      required: true,
      enum: Object.values(RestaurantPlan),
      default: RestaurantPlan.BUSINESS,
    },
    subscriptionStatus: {
      type: String,
      required: true,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
    startDate: { type: Date, required: true },
    expireDate: { type: Date, required: true },
    maxTables: { type: Number, required: true, min: 1, default: 30 },
    maxUsers: { type: Number, required: true, min: 1, default: 10 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

restaurantSchema.index({ subscriptionStatus: 1 });
restaurantSchema.index({ isActive: 1 });

export const Restaurant =
  mongoose.models.restaurants ||
  mongoose.model<IRestaurant>("restaurants", restaurantSchema);

export type RestaurantPlan = "starter" | "business" | "enterprise";
export type SubscriptionStatus = "active" | "expired" | "suspended";

export interface Restaurant {
  _id: string;
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
  startDate: string;
  expireDate: string;
  maxTables: number;
  maxUsers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

import mongoServer from "@/config/mongoConfig";
import {
  IRestaurant,
  Restaurant,
  RestaurantPlan,
  SubscriptionStatus,
} from "@/model/restaurant";
import mongoose from "mongoose";

export type CreateRestaurantInput = {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
};

export type UpdateRestaurantInput = Partial<
  Pick<
    IRestaurant,
    | "name"
    | "ownerName"
    | "email"
    | "phone"
    | "address"
    | "plan"
    | "maxTables"
    | "maxUsers"
    | "subscriptionStatus"
    | "expireDate"
  >
>;

const PLAN_LIMITS: Record<RestaurantPlan, { maxTables: number; maxUsers: number }> = {
  [RestaurantPlan.STARTER]: { maxTables: 10, maxUsers: 5 },
  [RestaurantPlan.BUSINESS]: { maxTables: 30, maxUsers: 10 },
  [RestaurantPlan.ENTERPRISE]: { maxTables: 200, maxUsers: 50 },
};

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugifyName(name) || "restaurant";
  let slug = base;
  let suffix = 1;

  while (await Restaurant.exists({ slug })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  return slug;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function createRestaurant(
  input: CreateRestaurantInput
): Promise<IRestaurant> {
  await mongoServer();

  const name = input.name.trim();
  const ownerName = input.ownerName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const address = input.address?.trim() ?? "";

  if (!name || !ownerName || !email || !phone) {
    throw new Error("Рестораны нэр, эзэмшигч, имэйл, утас заавал шаардлагатай");
  }

  const slug = await generateUniqueSlug(name);
  const startDate = new Date();
  const expireDate = addDays(startDate, 30);
  const limits = PLAN_LIMITS[RestaurantPlan.BUSINESS];

  return Restaurant.create({
    name,
    slug,
    ownerName,
    email,
    phone,
    address,
    plan: RestaurantPlan.BUSINESS,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    startDate,
    expireDate,
    maxTables: limits.maxTables,
    maxUsers: limits.maxUsers,
    isActive: true,
  });
}

export async function getRestaurant(
  id: string | mongoose.Types.ObjectId
): Promise<IRestaurant | null> {
  await mongoServer();

  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Restaurant.findById(id);
}

export async function getRestaurants(): Promise<IRestaurant[]> {
  await mongoServer();
  return Restaurant.find().sort({ createdAt: -1 });
}

export async function updateRestaurant(
  id: string | mongoose.Types.ObjectId,
  input: UpdateRestaurantInput
): Promise<IRestaurant | null> {
  await mongoServer();

  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  const updates: UpdateRestaurantInput = { ...input };

  if (typeof updates.email === "string") {
    updates.email = updates.email.trim().toLowerCase();
  }
  if (typeof updates.name === "string") {
    updates.name = updates.name.trim();
  }
  if (typeof updates.ownerName === "string") {
    updates.ownerName = updates.ownerName.trim();
  }
  if (typeof updates.phone === "string") {
    updates.phone = updates.phone.trim();
  }
  if (typeof updates.address === "string") {
    updates.address = updates.address.trim();
  }

  if (updates.plan && PLAN_LIMITS[updates.plan]) {
    const limits = PLAN_LIMITS[updates.plan];
    updates.maxTables = updates.maxTables ?? limits.maxTables;
    updates.maxUsers = updates.maxUsers ?? limits.maxUsers;
  }

  return Restaurant.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
}

export async function activateRestaurant(
  id: string | mongoose.Types.ObjectId
): Promise<IRestaurant | null> {
  await mongoServer();

  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Restaurant.findByIdAndUpdate(
    id,
    {
      isActive: true,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
    { new: true, runValidators: true }
  );
}

export async function deactivateRestaurant(
  id: string | mongoose.Types.ObjectId
): Promise<IRestaurant | null> {
  await mongoServer();

  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Restaurant.findByIdAndUpdate(
    id,
    {
      isActive: false,
      subscriptionStatus: SubscriptionStatus.SUSPENDED,
    },
    { new: true, runValidators: true }
  );
}

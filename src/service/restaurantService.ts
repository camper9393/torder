import mongoServer from "@/config/mongoConfig";
import {
  IRestaurant,
  Restaurant,
  RestaurantPlan,
  SubscriptionStatus,
} from "@/model/restaurant";
import mongoose from "mongoose";

export type CreateRestaurantOwnerAccountInput = {
  username: string;
  password: string;
};

export type CreateRestaurantInput = {
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address?: string;
  plan?: RestaurantPlan;
  expireDate?: Date | string;
  maxTables?: number;
  maxUsers?: number;
  ownerAccount?: CreateRestaurantOwnerAccountInput;
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
    | "isActive"
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
  const plan =
    input.plan && PLAN_LIMITS[input.plan]
      ? input.plan
      : RestaurantPlan.BUSINESS;
  const limits = PLAN_LIMITS[plan];
  const expireDate = input.expireDate
    ? new Date(input.expireDate)
    : addDays(startDate, 30);

  const restaurant = await Restaurant.create({
    name,
    slug,
    ownerName,
    email,
    phone,
    address,
    plan,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    startDate,
    expireDate,
    maxTables: input.maxTables ?? limits.maxTables,
    maxUsers: input.maxUsers ?? limits.maxUsers,
    isActive: true,
  });

  if (input.ownerAccount?.username && input.ownerAccount?.password) {
    const { provisionRestaurantOwner } = await import("@/service/staffService");
    try {
      await provisionRestaurantOwner(restaurant._id, {
        name: ownerName,
        email,
        username: input.ownerAccount.username,
        password: input.ownerAccount.password,
      });
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Тодорхойгүй алдаа";
      throw new Error(
        `Ресторан үүслээ ч эзэмшигчийн бүртгэл үүсгэхэд алдаа: ${detail}`
      );
    }
  }

  const { logActivity } = await import("@/service/activityLogService");
  await logActivity({
    restaurantId: restaurant._id,
    action: "restaurant.created",
    targetType: "restaurant",
    targetId: String(restaurant._id),
    message: `Шинэ ресторан үүслээ: ${restaurant.name}`,
  });

  return restaurant;
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

  const updated = await Restaurant.findByIdAndUpdate(
    id,
    {
      isActive: true,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
    { new: true, runValidators: true }
  );

  if (updated) {
    const { logActivity } = await import("@/service/activityLogService");
    await logActivity({
      restaurantId: updated._id,
      action: "restaurant.activated",
      targetType: "restaurant",
      targetId: String(updated._id),
      message: `Ресторан идэвхжлээ: ${updated.name}`,
    });
  }

  return updated;
}

export async function deactivateRestaurant(
  id: string | mongoose.Types.ObjectId
): Promise<IRestaurant | null> {
  await mongoServer();

  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  const updated = await Restaurant.findByIdAndUpdate(
    id,
    {
      isActive: false,
      subscriptionStatus: SubscriptionStatus.SUSPENDED,
    },
    { new: true, runValidators: true }
  );

  if (updated) {
    const { logActivity } = await import("@/service/activityLogService");
    await logActivity({
      restaurantId: updated._id,
      action: "restaurant.deactivated",
      targetType: "restaurant",
      targetId: String(updated._id),
      message: `Ресторан идэвхгүй боллоо: ${updated.name}`,
    });
  }

  return updated;
}

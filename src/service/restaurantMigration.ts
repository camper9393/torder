import mongoServer from "@/config/mongoConfig";
import {
  Restaurant,
  RestaurantPlan,
  SubscriptionStatus,
} from "@/model/restaurant";
import { Menu } from "@/model/menu";
import { MenuOrder } from "@/model/menuOrder";
import { Order } from "@/model/order";
import { TableLayout } from "@/model/tableLayout";
import { User, UserRole } from "@/model/user";
import mongoose from "mongoose";

const DEFAULT_RESTAURANT_SLUG = "default-legacy";

const MISSING_RESTAURANT_FILTER = {
  $or: [{ restaurantId: { $exists: false } }, { restaurantId: null }],
};

let cachedDefaultRestaurantId: mongoose.Types.ObjectId | null = null;

export type CollectionMigrationStats = {
  matchedCount: number;
  modifiedCount: number;
};

export type RestaurantMigrationReport = {
  defaultRestaurantId: string;
  users: CollectionMigrationStats;
  tables: CollectionMigrationStats;
  orders: CollectionMigrationStats;
  menus: CollectionMigrationStats;
  categories: CollectionMigrationStats;
  warnings: string[];
  success: boolean;
};

function toStats(
  result: mongoose.mongo.UpdateResult | { matchedCount?: number; modifiedCount?: number }
): CollectionMigrationStats {
  return {
    matchedCount: result.matchedCount ?? 0,
    modifiedCount: result.modifiedCount ?? 0,
  };
}

function buildMigrationWarnings(report: Omit<RestaurantMigrationReport, "warnings" | "success">): string[] {
  const warnings: string[] = [];

  const check = (label: string, stats: CollectionMigrationStats) => {
    if (stats.matchedCount > 0 && stats.modifiedCount === 0) {
      warnings.push(
        `${label}: ${stats.matchedCount} бичлэг олдсон боловч 0 шинэчлэгдлээ (schema cache эсвэл update алдаа)`
      );
    }
  };

  check("users", report.users);
  check("orders", report.orders);
  check("menus", report.menus);
  check("tables", report.tables);
  check("categories", report.categories);

  return warnings;
}

export async function getDefaultRestaurantId(): Promise<mongoose.Types.ObjectId | null> {
  if (cachedDefaultRestaurantId) {
    return cachedDefaultRestaurantId;
  }

  await mongoServer();
  const existing = await Restaurant.findOne({ slug: DEFAULT_RESTAURANT_SLUG })
    .select("_id")
    .lean();

  if (existing?._id) {
    cachedDefaultRestaurantId = new mongoose.Types.ObjectId(String(existing._id));
    return cachedDefaultRestaurantId;
  }

  return null;
}

export async function ensureDefaultRestaurant(): Promise<mongoose.Types.ObjectId> {
  await mongoServer();

  const existing = await Restaurant.findOne({ slug: DEFAULT_RESTAURANT_SLUG });
  if (existing) {
    cachedDefaultRestaurantId = existing._id;
    return existing._id;
  }

  const startDate = new Date();
  const expireDate = new Date(startDate);
  expireDate.setDate(expireDate.getDate() + 30);

  const restaurant = await Restaurant.create({
    name: "Default Legacy Restaurant",
    slug: DEFAULT_RESTAURANT_SLUG,
    ownerName: "Legacy Owner",
    email: "legacy@qr-menu.local",
    phone: "00000000",
    address: "",
    plan: RestaurantPlan.BUSINESS,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    startDate,
    expireDate,
    maxTables: 200,
    maxUsers: 100,
    isActive: true,
  });

  cachedDefaultRestaurantId = restaurant._id;
  return restaurant._id;
}

export async function migrateRestaurantOwnership(): Promise<RestaurantMigrationReport> {
  await mongoServer();

  const defaultRestaurantId = await ensureDefaultRestaurant();

  const [users, tables, orders, menus, categories] = await Promise.all([
    User.updateMany(
      {
        role: { $ne: UserRole.PLATFORM_OWNER },
        ...MISSING_RESTAURANT_FILTER,
      },
      { $set: { restaurantId: defaultRestaurantId } }
    ),
    TableLayout.updateMany(MISSING_RESTAURANT_FILTER, {
      $set: { restaurantId: defaultRestaurantId },
    }),
    Order.updateMany(MISSING_RESTAURANT_FILTER, {
      $set: { restaurantId: defaultRestaurantId },
    }),
    Menu.updateMany(MISSING_RESTAURANT_FILTER, {
      $set: { restaurantId: defaultRestaurantId },
    }),
    MenuOrder.updateMany(MISSING_RESTAURANT_FILTER, {
      $set: { restaurantId: defaultRestaurantId },
    }),
  ]);

  const partial: Omit<RestaurantMigrationReport, "warnings" | "success"> = {
    defaultRestaurantId: String(defaultRestaurantId),
    users: toStats(users),
    tables: toStats(tables),
    orders: toStats(orders),
    menus: toStats(menus),
    categories: toStats(categories),
  };

  const warnings = buildMigrationWarnings(partial);

  return {
    ...partial,
    warnings,
    success: warnings.length === 0,
  };
}

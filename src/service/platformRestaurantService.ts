import mongoServer from "@/config/mongoConfig";
import { Menu } from "@/model/menu";
import { Order } from "@/model/order";
import {
  PlatformPayment,
  PlatformPaymentStatus,
} from "@/model/platformPayment";
import {
  Restaurant,
  SubscriptionStatus,
  type IRestaurant,
} from "@/model/restaurant";
import { TableLayout } from "@/model/tableLayout";
import { User, UserRole } from "@/model/user";
import { listStaffForRestaurant } from "@/service/staffService";
import { getPlanMonthlyPrice } from "@/utils/planPricing";
import { logActivity } from "@/service/activityLogService";
import { resetPlatformUserPassword } from "@/service/platformUserService";
import { listSupportRequests } from "@/service/platformSupportService";
import { listPlatformPayments } from "@/service/platformPaymentService";
import { serializePublicUser, serializeRestaurant } from "@/utils/platformSerialize";
import type { IUser } from "@/model/user";
import mongoose, { Types } from "mongoose";

function daysRemaining(expireDate: Date | string): number {
  const end = new Date(expireDate);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function buildWarnings(
  restaurant: IRestaurant,
  usage: { usersCount: number; tablesCount: number }
): string[] {
  const warnings: string[] = [];
  if (!restaurant.isActive) {
    warnings.push("Ресторан идэвхгүй байна");
  }
  if (restaurant.subscriptionStatus === SubscriptionStatus.EXPIRED) {
    warnings.push("Захиалгын хугацаа дууссан");
  }
  if (new Date(restaurant.expireDate) < new Date()) {
    warnings.push("Дуусах огноо өнгөрсөн");
  }
  if (usage.usersCount > restaurant.maxUsers) {
    warnings.push("Хэрэглэгчийн дээд хязгаар хэтэрсэн");
  }
  if (usage.tablesCount > restaurant.maxTables) {
    warnings.push("Ширээний дээд хязгаар хэтэрсэн");
  }
  return warnings;
}

export type RestaurantListFilters = {
  status?: string;
  plan?: string;
  search?: string;
};

async function getCountsForRestaurant(restaurantId: Types.ObjectId) {
  const [usersCount, tablesCount, menuItemsCount, ordersCount] =
    await Promise.all([
      User.countDocuments({ restaurantId }),
      TableLayout.countDocuments({ restaurantId }),
      Menu.countDocuments({ restaurantId }),
      Order.countDocuments({ restaurantId }),
    ]);
  return { usersCount, tablesCount, menuItemsCount, ordersCount };
}

export async function listRestaurantsEnriched(filters: RestaurantListFilters = {}) {
  await mongoServer();

  const query: Record<string, unknown> = {};
  const status = filters.status?.trim();

  if (status === "active") {
    query.isActive = true;
    query.subscriptionStatus = SubscriptionStatus.ACTIVE;
  } else if (status === "expired") {
    query.subscriptionStatus = SubscriptionStatus.EXPIRED;
  } else if (status === "suspended") {
    query.subscriptionStatus = SubscriptionStatus.SUSPENDED;
  } else if (status === "inactive") {
    query.isActive = false;
  }

  if (filters.plan) {
    query.plan = filters.plan;
  }

  const search = filters.search?.trim().toLowerCase();
  let restaurants = await Restaurant.find(query).sort({ createdAt: -1 }).lean();

  if (search) {
    restaurants = restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(search) ||
        r.ownerName.toLowerCase().includes(search) ||
        r.email.toLowerCase().includes(search) ||
        r.phone.includes(search)
    );
  }

  const enriched = await Promise.all(
    restaurants.map(async (r) => {
      const rid = new Types.ObjectId(String(r._id));
      const counts = await getCountsForRestaurant(rid);
      const hasPendingPayment = Boolean(
        await PlatformPayment.exists({
          restaurantId: rid,
          status: {
            $in: [PlatformPaymentStatus.PENDING, PlatformPaymentStatus.OVERDUE],
          },
        })
      );
      const remaining = daysRemaining(r.expireDate);
      return {
        ...serializeRestaurant(r as IRestaurant),
        ...counts,
        hasPendingPayment,
        daysRemaining: remaining,
        displayId: `RST-${String(r._id).slice(-6).toUpperCase()}`,
      };
    })
  );

  return enriched;
}

export async function getRestaurantSummary(restaurantId: string) {
  await mongoServer();
  if (!mongoose.isValidObjectId(restaurantId)) return null;

  const rid = new Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(rid).lean();
  if (!restaurant) return null;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    counts,
    todayOrders,
    monthlyOrders,
    lastOrder,
    staff,
    lastPayment,
    pendingPayment,
  ] = await Promise.all([
    getCountsForRestaurant(rid),
    Order.countDocuments({ restaurantId: rid, createdAt: { $gte: todayStart } }),
    Order.countDocuments({ restaurantId: rid, createdAt: { $gte: monthStart } }),
    Order.findOne({ restaurantId: rid }).sort({ createdAt: -1 }).select("createdAt").lean(),
    listStaffForRestaurant(rid),
    PlatformPayment.findOne({ restaurantId: rid, status: PlatformPaymentStatus.PAID })
      .sort({ paidAt: -1 })
      .lean(),
    PlatformPayment.findOne({
      restaurantId: rid,
      status: { $in: [PlatformPaymentStatus.PENDING, PlatformPaymentStatus.OVERDUE] },
    })
      .sort({ dueDate: 1 })
      .lean(),
  ]);

  const owner = staff.find((u) => u.role === UserRole.RESTAURANT_OWNER);
  const usage = {
    ...counts,
    staffCount: staff.length,
    todayOrders,
    monthlyOrders,
    lastActivityDate: lastOrder?.createdAt
      ? new Date(lastOrder.createdAt).toISOString()
      : null,
  };

  return {
    restaurant: serializeRestaurant(restaurant as IRestaurant),
    displayId: `RST-${String(restaurant._id).slice(-6).toUpperCase()}`,
    usage,
    subscription: {
      plan: restaurant.plan,
      subscriptionStatus: restaurant.subscriptionStatus,
      startDate: new Date(restaurant.startDate).toISOString(),
      expireDate: new Date(restaurant.expireDate).toISOString(),
      daysRemaining: daysRemaining(restaurant.expireDate),
      maxTables: restaurant.maxTables,
      maxUsers: restaurant.maxUsers,
    },
    billing: {
      plan: restaurant.plan,
      monthlyPrice: getPlanMonthlyPrice(restaurant.plan),
      lastPaymentDate: lastPayment?.paidAt
        ? new Date(lastPayment.paidAt).toISOString()
        : null,
      nextDueDate: pendingPayment?.dueDate
        ? new Date(pendingPayment.dueDate).toISOString()
        : new Date(restaurant.expireDate).toISOString(),
      paymentStatus: pendingPayment?.status ?? restaurant.subscriptionStatus,
      hasPendingPayment: Boolean(pendingPayment),
    },
    system: {
      restaurantId: String(restaurant._id),
      slug: restaurant.slug,
      createdAt: new Date(restaurant.createdAt).toISOString(),
      updatedAt: new Date(restaurant.updatedAt).toISOString(),
      maxTables: restaurant.maxTables,
      currentTables: counts.tablesCount,
      maxUsers: restaurant.maxUsers,
      currentUsers: counts.usersCount,
      menuItems: counts.menuItemsCount,
      orders: counts.ordersCount,
      tenantScope: restaurant.isActive ? "active" : "inactive",
    },
    warnings: buildWarnings(restaurant as IRestaurant, usage),
    users: staff.map((u) => ({
      ...serializePublicUser(u),
      createdAt: new Date(u.createdAt).toISOString(),
    })),
    owner: owner
      ? {
          _id: String(owner._id),
          name: owner.name,
          username: owner.username,
          email: owner.email,
        }
      : null,
  };
}

export async function getRestaurantUsers(restaurantId: string) {
  if (!mongoose.isValidObjectId(restaurantId)) return null;
  const rid = new Types.ObjectId(restaurantId);
  const restaurant = await Restaurant.findById(rid).select("_id").lean();
  if (!restaurant) return null;

  const users = await User.find({ restaurantId: rid })
    .sort({ role: 1, name: 1 })
    .lean();

  return users.map((u) => ({
    ...serializePublicUser(u as IUser),
    createdAt: new Date(u.createdAt).toISOString(),
  }));
}

export async function getRestaurantPayments(restaurantId: string) {
  if (!mongoose.isValidObjectId(restaurantId)) return null;
  const restaurant = await Restaurant.findById(restaurantId).lean();
  if (!restaurant) return null;

  const payments = await listPlatformPayments({ restaurantId });
  return {
    restaurant: serializeRestaurant(restaurant as IRestaurant),
    payments,
    billing: {
      plan: restaurant.plan,
      monthlyPrice: getPlanMonthlyPrice(restaurant.plan),
    },
  };
}

export async function getRestaurantSupport(restaurantId: string) {
  if (!mongoose.isValidObjectId(restaurantId)) return null;
  const restaurant = await Restaurant.findById(restaurantId).select("_id name").lean();
  if (!restaurant) return null;

  const tickets = await listSupportRequests({ restaurantId });
  return { restaurantName: restaurant.name, tickets };
}

export async function resetRestaurantOwnerPassword(
  actor: IUser,
  restaurantId: string,
  newPassword: string
) {
  if (!mongoose.isValidObjectId(restaurantId)) return null;

  const owner = await User.findOne({
    restaurantId: new Types.ObjectId(restaurantId),
    role: UserRole.RESTAURANT_OWNER,
  }).select("_id");

  if (!owner) return null;

  const ok = await resetPlatformUserPassword(actor, String(owner._id), newPassword);
  if (!ok) return null;

  await logActivity({
    actorUserId: actor._id,
    actorRole: actor.role,
    restaurantId: new Types.ObjectId(restaurantId),
    action: "restaurant.owner_password_reset",
    targetType: "user",
    targetId: String(owner._id),
    message: "Рестораны эзэмшигчийн нууц үг шинэчлэгдлээ",
  });

  return { ownerId: String(owner._id) };
}

export async function extendRestaurantSubscription(
  restaurantId: string,
  months: number
) {
  await mongoServer();
  if (!mongoose.isValidObjectId(restaurantId) || months < 1) {
    return null;
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return null;

  const base =
    restaurant.expireDate > new Date() ? new Date(restaurant.expireDate) : new Date();
  base.setMonth(base.getMonth() + months);
  restaurant.expireDate = base;
  restaurant.subscriptionStatus = SubscriptionStatus.ACTIVE;
  restaurant.isActive = true;
  await restaurant.save();

  return serializeRestaurant(restaurant);
}

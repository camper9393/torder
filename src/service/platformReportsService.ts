import mongoServer from "@/config/mongoConfig";
import { Order } from "@/model/order";
import {
  PlatformPayment,
  PlatformPaymentStatus,
} from "@/model/platformPayment";
import {
  Restaurant,
  RestaurantPlan,
  SubscriptionStatus,
} from "@/model/restaurant";
import { User, UserRole } from "@/model/user";
import { getPlanMonthlyPrice } from "@/utils/planPricing";

export async function getPlatformReports() {
  await mongoServer();

  const [restaurants, usersByRole, paidRevenue] = await Promise.all([
    Restaurant.find().lean(),
    User.aggregate([
      { $match: { role: { $ne: UserRole.PLATFORM_OWNER } } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]),
    PlatformPayment.aggregate([
      { $match: { status: PlatformPaymentStatus.PAID } },
      { $group: { _id: "$restaurantId", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const restaurantMap = new Map(
    restaurants.map((r) => [String(r._id), r.name])
  );

  const topByRevenue = paidRevenue.map((row) => ({
    restaurantId: String(row._id),
    restaurantName: restaurantMap.get(String(row._id)) ?? "—",
    revenue: row.total as number,
    estimated: false,
  }));

  if (topByRevenue.length === 0) {
    const estimated = restaurants
      .filter((r) => r.isActive)
      .map((r) => ({
        restaurantId: String(r._id),
        restaurantName: r.name,
        revenue: getPlanMonthlyPrice(r.plan),
        estimated: true,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    topByRevenue.push(...estimated);
  }

  const topByOrders = await Order.aggregate([
    { $match: { restaurantId: { $exists: true, $ne: null } } },
    { $group: { _id: "$restaurantId", orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
    { $sort: { orders: -1 } },
    { $limit: 10 },
  ]);

  const planDistribution = Object.values(RestaurantPlan).map((plan) => ({
    plan,
    count: restaurants.filter((r) => r.plan === plan).length,
  }));

  const subscriptionBreakdown = {
    active: restaurants.filter(
      (r) => r.subscriptionStatus === SubscriptionStatus.ACTIVE && r.isActive
    ).length,
    expired: restaurants.filter(
      (r) => r.subscriptionStatus === SubscriptionStatus.EXPIRED
    ).length,
    suspended: restaurants.filter(
      (r) => r.subscriptionStatus === SubscriptionStatus.SUSPENDED
    ).length,
  };

  const now = new Date();
  const monthlyGrowth: { month: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const count = restaurants.filter(
      (r) => r.createdAt >= start && r.createdAt < end
    ).length;
    monthlyGrowth.push({
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      count,
    });
  }

  const monthlyRevenueEstimate = restaurants
    .filter((r) => r.isActive)
    .reduce((sum, r) => sum + getPlanMonthlyPrice(r.plan), 0);

  return {
    topRestaurantsByRevenue: topByRevenue,
    topRestaurantsByOrders: topByOrders.map((row) => ({
      restaurantId: String(row._id),
      restaurantName: restaurantMap.get(String(row._id)) ?? "—",
      orders: row.orders as number,
      revenue: row.revenue as number,
    })),
    monthlyRestaurantGrowth: monthlyGrowth,
    monthlyRevenueEstimate,
    revenueIsEstimated: paidRevenue.length === 0,
    subscriptionBreakdown,
    usersByRole: usersByRole.map((row) => ({
      role: row._id as string,
      count: row.count as number,
    })),
    planDistribution,
  };
}

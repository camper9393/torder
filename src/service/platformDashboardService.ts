import mongoServer from "@/config/mongoConfig";
import {
  PlatformPayment,
  PlatformPaymentStatus,
} from "@/model/platformPayment";
import {
  Restaurant,
  SubscriptionStatus,
} from "@/model/restaurant";
import { SupportRequest, SupportStatus } from "@/model/supportRequest";
import { SystemError, SystemErrorLevel } from "@/model/systemError";
import { User, UserRole } from "@/model/user";
import { Order } from "@/model/order";
import { getPlanMonthlyPrice } from "@/utils/planPricing";
import { serializePublicUser, serializeRestaurant } from "@/utils/platformSerialize";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export async function getPlatformDashboard() {
  await mongoServer();

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    restaurants,
    totalUsers,
    restaurantOwners,
    staffUsers,
    paidPayments,
    pendingPayments,
    supportOpenCount,
    recentUsers,
    unresolvedErrors,
  ] = await Promise.all([
    Restaurant.find().sort({ createdAt: -1 }).lean(),
    User.countDocuments({ role: { $ne: UserRole.PLATFORM_OWNER } }),
    User.countDocuments({ role: UserRole.RESTAURANT_OWNER }),
    User.countDocuments({
      role: {
        $in: [
          UserRole.MANAGER,
          UserRole.CASHIER,
          UserRole.WAITER,
          UserRole.KITCHEN,
        ],
      },
    }),
    PlatformPayment.countDocuments({ status: PlatformPaymentStatus.PAID }),
    PlatformPayment.countDocuments({
      status: { $in: [PlatformPaymentStatus.PENDING, PlatformPaymentStatus.OVERDUE] },
    }),
    SupportRequest.countDocuments({
      status: { $in: [SupportStatus.NEW, SupportStatus.IN_PROGRESS, SupportStatus.WAITING] },
    }),
    User.find({ role: { $ne: UserRole.PLATFORM_OWNER } })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    SystemError.countDocuments({
      resolved: false,
      level: { $in: [SystemErrorLevel.ERROR, SystemErrorLevel.CRITICAL] },
    }),
  ]);

  const activeRestaurants = restaurants.filter(
    (r) => r.isActive && r.subscriptionStatus === SubscriptionStatus.ACTIVE
  ).length;
  const expiredRestaurants = restaurants.filter(
    (r) => r.subscriptionStatus === SubscriptionStatus.EXPIRED
  ).length;
  const suspendedRestaurants = restaurants.filter(
    (r) => r.subscriptionStatus === SubscriptionStatus.SUSPENDED
  ).length;

  const paidAgg = await PlatformPayment.aggregate([
    { $match: { status: PlatformPaymentStatus.PAID } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalRevenueFromPayments = paidAgg[0]?.total ?? 0;

  const estimatedMonthlyRevenue = restaurants
    .filter((r) => r.isActive)
    .reduce((sum, r) => sum + getPlanMonthlyPrice(r.plan), 0);

  const totalRevenueEstimate =
    totalRevenueFromPayments > 0
      ? totalRevenueFromPayments
      : estimatedMonthlyRevenue;

  const revenueByMonth = await PlatformPayment.aggregate([
    {
      $match: {
        status: PlatformPaymentStatus.PAID,
        paidAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$paidAt" },
        },
        revenue: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const revenueChart: { month: string; revenue: number; estimated: boolean }[] =
    [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const key = monthKey(d);
    const row = revenueByMonth.find((r) => r._id === key);
    revenueChart.push({
      month: key,
      revenue: row?.revenue ?? 0,
      estimated: !row,
    });
  }

  const growthByMonth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now);
    start.setMonth(start.getMonth() - i);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const count = restaurants.filter(
      (r) => r.createdAt >= start && r.createdAt < end
    ).length;
    growthByMonth.push({ month: monthKey(start), count });
  }

  const orderRevenueAgg = await Order.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$total" },
      },
    },
  ]);

  const systemAlerts: { level: string; message: string }[] = [];
  if (expiredRestaurants > 0) {
    systemAlerts.push({
      level: "warning",
      message: `${expiredRestaurants} рестораны захиалга хугацаа дууссан`,
    });
  }
  if (pendingPayments > 0) {
    systemAlerts.push({
      level: "info",
      message: `${pendingPayments} хүлээгдэж буй төлбөр байна`,
    });
  }
  if (supportOpenCount > 0) {
    systemAlerts.push({
      level: "info",
      message: `${supportOpenCount} нээлттэй support хүсэлт`,
    });
  }
  if (unresolvedErrors > 0) {
    systemAlerts.push({
      level: "error",
      message: `${unresolvedErrors} шийдэгдээгүй системийн алдаа`,
    });
  }

  return {
    totalRestaurants: restaurants.length,
    activeRestaurants,
    expiredRestaurants,
    suspendedRestaurants,
    totalUsers,
    restaurantOwners,
    staffUsers,
    totalRevenueEstimate,
    totalPosOrderRevenue: orderRevenueAgg[0]?.total ?? 0,
    revenueIsEstimated: totalRevenueFromPayments === 0,
    paidCount: paidPayments,
    pendingPaymentCount: pendingPayments,
    supportOpenCount,
    recentRestaurants: restaurants.slice(0, 8).map(serializeRestaurant),
    recentUsers: recentUsers.map((u) => serializePublicUser(u)),
    revenueChart,
    restaurantGrowthChart: growthByMonth,
    paymentStatus: {
      paid: paidPayments,
      pending: pendingPayments,
    },
    systemAlerts,
  };
}

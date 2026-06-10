import mongoServer from "@/config/mongoConfig";
import { verifyAuth } from "@/middleware/auth";
import { Order, OrderStatus } from "@/model/order";
import { Refund } from "@/model/refund";
import { sendRJResponse } from "@/utils/api";
import { getInventoryAlerts } from "@/utils/inventoryDeduction";
import mongoose, { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function buildLast7Days(): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = startOfDay(d).toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    days.push({ date, label });
  }
  return days;
}

async function resolveMerchantId(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) return null;
  if (!authResult || !mongoose.isValidObjectId(authResult)) return null;
  return new Types.ObjectId(String(authResult));
}

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const merchantId = await resolveMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const sevenDaysStart = startOfDay(new Date());
    sevenDaysStart.setDate(sevenDaysStart.getDate() - 6);

    const matchMerchant = { merchantId };

    const [
      todayStats,
      todayRefundsAgg,
      statusAgg,
      topItems,
      recentOrders,
      dailyStats,
      dailyRefundsAgg,
      inventoryAlerts,
    ] = await Promise.all([
      Order.aggregate([
        { $match: matchMerchant },
        {
          $facet: {
            today: [
              {
                $match: {
                  createdAt: { $gte: todayStart, $lte: todayEnd },
                },
              },
              {
                $group: {
                  _id: null,
                  revenue: { $sum: "$total" },
                  count: { $sum: 1 },
                },
              },
            ],
            active: [
              {
                $match: {
                  status: { $in: ["new", "accepted", "cooking"] },
                },
              },
              { $count: "count" },
            ],
            completed: [
              { $match: { status: "done" } },
              { $count: "count" },
            ],
          },
        },
      ]),

      Refund.aggregate([
        {
          $match: {
            merchantId,
            createdAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$refundAmount" },
          },
        },
      ]),

      Order.aggregate([
        { $match: matchMerchant },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Order.aggregate([
        { $match: matchMerchant },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.title",
            quantity: { $sum: "$items.quantity" },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, title: "$_id", quantity: 1 } },
      ]),

      Order.find(matchMerchant)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("tableName total status createdAt")
        .lean(),

      Order.aggregate([
        {
          $match: {
            ...matchMerchant,
            createdAt: { $gte: sevenDaysStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
      ]),

      Refund.aggregate([
        {
          $match: {
            merchantId,
            createdAt: { $gte: sevenDaysStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            refunds: { $sum: "$refundAmount" },
          },
        },
      ]),

      getInventoryAlerts(merchantId, 5),
    ]);

    const facet = todayStats[0] ?? {};
    const todayRow = facet.today?.[0];
    const todayGrossRevenue = todayRow?.revenue ?? 0;
    const todayRefunds = todayRefundsAgg[0]?.total ?? 0;
    const activeCount = facet.active?.[0]?.count ?? 0;
    const completedCount = facet.completed?.[0]?.count ?? 0;

    const statusCounts: Record<OrderStatus, number> = {
      new: 0,
      accepted: 0,
      cooking: 0,
      done: 0,
      closed: 0,
    };
    for (const row of statusAgg) {
      const key = row._id as OrderStatus;
      if (key in statusCounts) statusCounts[key] = row.count;
    }

    const dayMap = new Map(
      dailyStats.map((d) => [
        d._id as string,
        { revenue: d.revenue as number, orders: d.orders as number },
      ])
    );

    const refundDayMap = new Map(
      dailyRefundsAgg.map((d) => [d._id as string, d.refunds as number])
    );

    const last7 = buildLast7Days();
    const chartDays = last7.map(({ date, label }) => {
      const revenue = dayMap.get(date)?.revenue ?? 0;
      const refunds = refundDayMap.get(date) ?? 0;
      return {
        date,
        label,
        revenue,
        refunds,
        netRevenue: revenue - refunds,
        orders: dayMap.get(date)?.orders ?? 0,
      };
    });

    return sendRJResponse({
      success: true,
      message: "Admin dashboard fetched",
      data: {
        metrics: {
          todayRevenue: todayGrossRevenue,
          todayRefunds,
          todayNetRevenue: todayGrossRevenue - todayRefunds,
          todayOrders: todayRow?.count ?? 0,
          activeOrders: activeCount,
          completedOrders: completedCount,
        },
        statusCounts,
        topItems,
        recentOrders: recentOrders.map((o) => ({
          _id: String(o._id),
          tableName: o.tableName,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt.toISOString(),
        })),
        revenueByDay: chartDays,
        ordersByDay: chartDays,
        inventoryAlerts,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

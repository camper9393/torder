"use client";

import { RestaurantAvatar } from "@/components/Platform/Restaurants/restaurantUi";
import {
  PlatformBarChart,
  PlatformCard,
  PlatformDonutChart,
  PlatformEmpty,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
  PlatformStatCard,
} from "@/components/Platform/shared";
import { ROLE_LABELS_MN, UserRole } from "@/constants/userRoles";
import { GET_PLATFORM_DASHBOARD } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import {
  AlertCircle,
  Building2,
  CreditCard,
  Headphones,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import React from "react";

type DashboardData = {
  totalRestaurants: number;
  activeRestaurants: number;
  expiredRestaurants: number;
  totalUsers: number;
  totalRevenueEstimate: number;
  revenueIsEstimated: boolean;
  paidCount: number;
  pendingPaymentCount: number;
  supportOpenCount: number;
  recentRestaurants: { _id: string; name: string; plan: string; createdAt?: string }[];
  recentUsers: { _id: string; name: string; role: string; restaurantName?: string }[];
  revenueChart: { month: string; revenue: number; estimated: boolean }[];
  restaurantGrowthChart: { month: string; count: number }[];
  paymentStatus?: { paid: number; pending: number };
  systemAlerts: { level: string; message: string }[];
};

export default function PlatformDashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    void (async () => {
      const res = await getApi<{ success: boolean; data?: DashboardData; message?: string }>({
        url: GET_PLATFORM_DASHBOARD,
      });
      if (!res?.success || !res.data) {
        setError(res?.message || "Алдаа гарлаа");
      } else {
        setData(res.data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <PlatformLoading />;
  if (error || !data) return <PlatformError message={error} />;

  const activePct =
    data.totalRestaurants > 0
      ? Math.round((data.activeRestaurants / data.totalRestaurants) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Хянах самбар"
        description="Platform түвшний ерөнхий хяналт, статистик"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PlatformStatCard
          label="Нийт ресторан"
          value={data.totalRestaurants}
          sub={`${data.activeRestaurants} идэвхтэй`}
          icon={Building2}
          tone="blue"
        />
        <PlatformStatCard
          label="Идэвхтэй ресторан"
          value={data.activeRestaurants}
          sub={`${activePct}% нийтээс`}
          icon={TrendingUp}
          tone="green"
        />
        <PlatformStatCard
          label="Нийт хэрэглэгч"
          value={data.totalUsers.toLocaleString()}
          icon={Users}
          tone="slate"
        />
        <PlatformStatCard
          label={data.revenueIsEstimated ? "Нийт орлого (тооцоо)" : "Нийт орлого"}
          value={`${data.totalRevenueEstimate.toLocaleString()} ₮`}
          icon={CreditCard}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <PlatformStatCard label="Төлбөр төлсөн" value={data.paidCount} tone="green" />
        <PlatformStatCard label="Хүлээгдэж буй" value={data.pendingPaymentCount} tone="amber" />
        <PlatformStatCard label="Support хүсэлт" value={data.supportOpenCount} icon={Headphones} tone="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PlatformCard title="Сарын орлого" className="lg:col-span-2">
          {data.revenueChart.length === 0 ? (
            <PlatformEmpty />
          ) : (
            <PlatformBarChart
              data={data.revenueChart}
              valueKey="revenue"
              labelKey="month"
              formatValue={(v) => `${(v / 1000).toFixed(0)}k`}
            />
          )}
          {data.revenueIsEstimated ? (
            <p className="mt-2 text-xs text-slate-400">* Зарим сар тооцоолсон өгөгдөл</p>
          ) : null}
        </PlatformCard>

        <PlatformCard title="Төлбөрийн төлөв">
          <PlatformDonutChart
            segments={[
              {
                label: "Төлсөн",
                value: data.paymentStatus?.paid ?? data.paidCount,
                color: "#22c55e",
              },
              {
                label: "Хүлээгдэж буй",
                value: data.paymentStatus?.pending ?? data.pendingPaymentCount,
                color: "#f59e0b",
              },
            ]}
          />
        </PlatformCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PlatformCard title="Сүүлийн ресторанууд">
          {data.recentRestaurants.length === 0 ? (
            <PlatformEmpty />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentRestaurants.map((r) => (
                <li key={r._id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <RestaurantAvatar name={r.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/platform/restaurants/${r._id}`}
                      className="font-medium text-slate-900 hover:text-blue-600"
                    >
                      {r.name}
                    </Link>
                    <p className="text-xs capitalize text-slate-400">{r.plan}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PlatformCard>

        <PlatformCard title="Сүүлийн хэрэглэгчид">
          {data.recentUsers.length === 0 ? (
            <PlatformEmpty />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentUsers.map((u) => (
                <li key={u._id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{u.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {u.restaurantName || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {ROLE_LABELS_MN[u.role as UserRole] ?? u.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PlatformCard>
      </div>

      {data.systemAlerts.length > 0 ? (
        <PlatformCard title="Системийн мэдэгдэл">
          <ul className="space-y-2">
            {data.systemAlerts.map((alert, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                {alert.message}
              </li>
            ))}
          </ul>
        </PlatformCard>
      ) : null}
    </div>
  );
}

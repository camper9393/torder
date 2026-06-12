"use client";

import {
  PlatformCard,
  PlatformEmpty,
  PlatformLoading,
  PlatformPageHeader,
} from "@/components/Platform/shared";
import { GET_PLATFORM_REPORTS } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import React from "react";

export default function PlatformReportsPage() {
  const [data, setData] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const res = await getApi<{ success: boolean; data?: Record<string, unknown> }>({
        url: GET_PLATFORM_REPORTS,
      });
      if (res?.success && res.data) setData(res.data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <PlatformLoading />;
  if (!data) return <PlatformEmpty />;

  const topRevenue = (data.topRestaurantsByRevenue as { restaurantName: string; revenue: number; estimated?: boolean }[]) ?? [];
  const topOrders = (data.topRestaurantsByOrders as { restaurantName: string; orders: number }[]) ?? [];
  const usersByRole = (data.usersByRole as { role: string; count: number }[]) ?? [];
  const plans = (data.planDistribution as { plan: string; count: number }[]) ?? [];

  return (
    <div className="space-y-6">
      <PlatformPageHeader title="Тайлан, статистик" />
      <div className="grid gap-6 lg:grid-cols-2">
        <PlatformCard>
          <h2 className="mb-3 font-semibold">Орлогоор TOP</h2>
          {topRevenue.length === 0 ? (
            <PlatformEmpty />
          ) : (
            <ul className="space-y-2 text-sm">
              {topRevenue.map((r, i) => (
                <li key={i} className="flex justify-between">
                  <span>{r.restaurantName}</span>
                  <span>
                    {r.revenue.toLocaleString()} ₮{r.estimated ? " *" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PlatformCard>
        <PlatformCard>
          <h2 className="mb-3 font-semibold">Захиалгаар TOP</h2>
          {topOrders.length === 0 ? (
            <PlatformEmpty />
          ) : (
            <ul className="space-y-2 text-sm">
              {topOrders.map((r, i) => (
                <li key={i} className="flex justify-between">
                  <span>{r.restaurantName}</span>
                  <span>{r.orders}</span>
                </li>
              ))}
            </ul>
          )}
        </PlatformCard>
        <PlatformCard>
          <h2 className="mb-3 font-semibold">Эрхээр</h2>
          <ul className="space-y-2 text-sm">
            {usersByRole.map((r) => (
              <li key={r.role} className="flex justify-between">
                <span>{r.role}</span>
                <span>{r.count}</span>
              </li>
            ))}
          </ul>
        </PlatformCard>
        <PlatformCard>
          <h2 className="mb-3 font-semibold">Багцаар</h2>
          <ul className="space-y-2 text-sm">
            {plans.map((p) => (
              <li key={p.plan} className="flex justify-between">
                <span>{p.plan}</span>
                <span>{p.count}</span>
              </li>
            ))}
          </ul>
        </PlatformCard>
      </div>
    </div>
  );
}

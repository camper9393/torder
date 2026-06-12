"use client";

import {
  PlatformCard,
  PlatformEmpty,
  PlatformLoading,
  PlatformPageHeader,
} from "@/components/Platform/shared";
import { GET_PLATFORM_ACTIVITY } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import React from "react";

type Log = {
  _id: string;
  action: string;
  message: string;
  actorName?: string;
  restaurantName?: string;
  createdAt: string;
};

export default function PlatformActivityPage() {
  const [items, setItems] = React.useState<Log[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const res = await getApi<{ success: boolean; data?: Log[] }>({
        url: GET_PLATFORM_ACTIVITY,
      });
      if (res?.success && res.data) setItems(res.data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PlatformPageHeader title="Activity log" />
      {loading ? <PlatformLoading /> : null}
      {!loading && items.length === 0 ? <PlatformEmpty /> : null}
      {!loading && items.length > 0 ? (
        <PlatformCard className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Огноо</th>
                <th className="px-4 py-3 text-left">Үйлдэл</th>
                <th className="px-4 py-3 text-left">Мессеж</th>
                <th className="px-4 py-3 text-left">Хэрэглэгч</th>
                <th className="px-4 py-3 text-left">Ресторан</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log._id} className="border-t border-slate-100">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("mn-MN")}
                  </td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3">{log.message}</td>
                  <td className="px-4 py-3">{log.actorName ?? "—"}</td>
                  <td className="px-4 py-3">{log.restaurantName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PlatformCard>
      ) : null}
    </div>
  );
}

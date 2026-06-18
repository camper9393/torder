"use client";

import React from "react";

import SettingsSectionCard from "@/components/Admin/Settings/SettingsSectionCard";
import { useSettingsApiParams } from "@/components/Admin/Settings/useSettingsApi";
import { GET_ADMIN_SETTINGS_SUBSCRIPTION } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import { cn } from "@/lib/utils";

type SubscriptionData = {
  currentPlan: string;
  subscriptionStatus: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  expireDate: string;
  remainingDays: number;
  paymentHistory: {
    date: string;
    amount: number;
    invoiceNumber: string;
    status: string;
  }[];
};

export default function SubscriptionSection() {
  const settingsApiParam = useSettingsApiParams();
  const [data, setData] = React.useState<SubscriptionData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const res = await getApi<{ success: boolean; data?: SubscriptionData }>({
        url: GET_ADMIN_SETTINGS_SUBSCRIPTION,
        param: settingsApiParam,
      });
      if (res?.success && res.data) setData(res.data);
      setLoading(false);
    })();
  }, [settingsApiParam]);

  if (loading || !data) {
    return (
      <SettingsSectionCard title="TOrder төлбөр">
        <p className="text-sm text-slate-500">Ачааллаж байна...</p>
      </SettingsSectionCard>
    );
  }

  return (
    <SettingsSectionCard
      title="TOrder төлбөр"
      description="Захиалгын төлбөрийн мэдээлэл (одоогоор mock өгөгдөл)."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Одоогийн багц" value={data.currentPlan} />
        <Stat label="Төлөв" value={data.subscriptionStatus} />
        <Stat label="Үлдсэн хоног" value={String(data.remainingDays)} />
        <Stat
          label="Дуусах огноо"
          value={new Date(data.expireDate).toLocaleDateString("mn-MN")}
        />
        <Stat
          label="Дараагийн төлбөр"
          value={
            data.nextPaymentDate
              ? new Date(data.nextPaymentDate).toLocaleDateString("mn-MN")
              : "—"
          }
        />
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Төлбөрийн түүх
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Огноо</th>
                <th className="px-4 py-3">Дүн</th>
                <th className="px-4 py-3">Нэхэмжлэх</th>
                <th className="px-4 py-3">Төлөв</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.paymentHistory.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    {new Date(row.date).toLocaleDateString("mn-MN")}
                  </td>
                  <td className="px-4 py-3">{row.amount.toLocaleString()} ₮</td>
                  <td className="px-4 py-3">{row.invoiceNumber}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SettingsSectionCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-slate-50 p-4")}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

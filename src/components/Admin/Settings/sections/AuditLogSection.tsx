"use client";

import React from "react";
import toast from "react-hot-toast";
import { Download } from "lucide-react";

import BackupPanel from "@/components/Admin/Settings/sections/BackupPanel";
import SettingsSectionCard from "@/components/Admin/Settings/SettingsSectionCard";
import { useSettingsApiParams } from "@/components/Admin/Settings/useSettingsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GET_ADMIN_SETTINGS_AUDIT } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";

type AuditRow = {
  _id: string;
  actorName?: string;
  action: string;
  module?: string;
  message: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  device?: string;
  createdAt: string;
};

export default function AuditLogSection() {
  const settingsApiParam = useSettingsApiParams();
  const [items, setItems] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filters, setFilters] = React.useState({
    from: "",
    to: "",
    module: "",
    action: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const param: Record<string, string> = { ...(settingsApiParam ?? {}) };
    if (filters.from) param.from = filters.from;
    if (filters.to) param.to = filters.to;
    if (filters.module) param.module = filters.module;
    if (filters.action) param.action = filters.action;

    const res = await getApi<{ success: boolean; data?: AuditRow[] }>({
      url: GET_ADMIN_SETTINGS_AUDIT,
      param,
    });
    if (res?.success && res.data) setItems(res.data);
    setLoading(false);
  }, [filters, settingsApiParam]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    const params = new URLSearchParams({
      ...(settingsApiParam ?? {}),
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
      ...(filters.module ? { module: filters.module } : {}),
      ...(filters.action ? { action: filters.action } : {}),
    });
    window.open(`/api/admin/settings/audit/export?${params.toString()}`, "_blank");
    toast.success("CSV татагдаж байна");
  };

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        title="Үйлдлийн бүртгэл"
        description="Системийн чухал үйлдлүүдийн түүх."
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
          <Input
            placeholder="Модуль"
            value={filters.module}
            onChange={(e) => setFilters((f) => ({ ...f, module: e.target.value }))}
          />
          <Input
            placeholder="Үйлдэл"
            value={filters.action}
            onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void load()}>
            Шүүх
          </Button>
          <Button type="button" variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" />
            CSV татах
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Ачааллаж байна...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">Бүртгэл олдсонгүй.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Огноо</th>
                  <th className="px-3 py-2">Хэрэглэгч</th>
                  <th className="px-3 py-2">Үйлдэл</th>
                  <th className="px-3 py-2">Модуль</th>
                  <th className="px-3 py-2">Мессеж</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row) => (
                  <tr key={row._id}>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                      {new Date(row.createdAt).toLocaleString("mn-MN")}
                    </td>
                    <td className="px-3 py-2">{row.actorName ?? "—"}</td>
                    <td className="px-3 py-2">{row.action}</td>
                    <td className="px-3 py-2">{row.module ?? "—"}</td>
                    <td className="max-w-xs truncate px-3 py-2">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsSectionCard>

      <BackupPanel />
    </div>
  );
}

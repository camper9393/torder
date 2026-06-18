"use client";

import React from "react";
import toast from "react-hot-toast";
import { Settings } from "lucide-react";

import SettingsFormActions from "@/components/Admin/Settings/SettingsFormActions";
import SettingsSectionCard from "@/components/Admin/Settings/SettingsSectionCard";
import { PAYMENT_SETTINGS_DEFAULTS } from "@/components/Admin/Settings/settingsDefaults";
import { useSettingsApiParams } from "@/components/Admin/Settings/useSettingsApi";
import { Button } from "@/components/ui/button";
import {
  GET_ADMIN_SETTINGS_PAYMENTS,
  PATCH_ADMIN_SETTINGS_PAYMENTS,
} from "@/utils/APIConstant";
import { getApi, patchApi } from "@/utils/common";

type MethodConfig = { enabled: boolean; label: string };
type Integration = {
  key: string;
  label: string;
  enabled: boolean;
  configured: boolean;
};

type PaymentData = {
  methods: Record<string, MethodConfig>;
  integrations: Integration[];
};

export default function PaymentsSection() {
  const settingsApiParam = useSettingsApiParams();
  const [data, setData] = React.useState<PaymentData>(PAYMENT_SETTINGS_DEFAULTS);
  const [snapshot, setSnapshot] = React.useState<PaymentData>(
    PAYMENT_SETTINGS_DEFAULTS
  );
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const applyPayload = React.useCallback((payload: PaymentData) => {
    const next: PaymentData = {
      methods: payload.methods ?? PAYMENT_SETTINGS_DEFAULTS.methods,
      integrations:
        payload.integrations?.length > 0
          ? payload.integrations
          : PAYMENT_SETTINGS_DEFAULTS.integrations,
    };
    setData(next);
    setSnapshot(next);
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getApi<{ success: boolean; message?: string; data?: PaymentData }>({
        url: GET_ADMIN_SETTINGS_PAYMENTS,
        param: settingsApiParam,
      });
      if (res?.success && res.data) {
        applyPayload(res.data);
      } else {
        setLoadError(res?.message || "Тохиргоо ачаалахад алдаа гарлаа");
        applyPayload(PAYMENT_SETTINGS_DEFAULTS);
      }
    } catch {
      setLoadError("Тохиргоо ачаалахад алдаа гарлаа");
      applyPayload(PAYMENT_SETTINGS_DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, [applyPayload, settingsApiParam]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggleMethod = (key: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        methods: {
          ...prev.methods,
          [key]: {
            ...prev.methods[key],
            enabled: !prev.methods[key]?.enabled,
          },
        },
      };
    });
  };

  const toggleIntegration = (key: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        integrations: prev.integrations.map((i) =>
          i.key === key ? { ...i, enabled: !i.enabled } : i
        ),
      };
    });
  };

  const save = async () => {
    setSaving(true);
    const res = await patchApi<{ success: boolean; message?: string }>({
      url: PATCH_ADMIN_SETTINGS_PAYMENTS,
      values: {
        methods: data.methods,
        integrations: data.integrations.map((i) => ({
          key: i.key,
          enabled: i.enabled,
        })),
      },
      param: settingsApiParam,
    });
    setSaving(false);
    if (!res?.success) {
      toast.error(res?.message || "Хадгалахад алдаа");
      return;
    }
    toast.success("Амжилттай хадгаллаа");
    await load();
  };

  if (loading) {
    return (
      <SettingsSectionCard title="Төлбөрийн суваг">
        <p className="text-sm text-slate-500">Ачааллаж байна...</p>
      </SettingsSectionCard>
    );
  }

  return (
    <SettingsSectionCard
      title="Төлбөрийн суваг"
      description="Төлбөрийн арга идэвхжүүлэх / идэвхгүй болгох."
    >
      {loadError ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {loadError}
        </p>
      ) : null}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Үндсэн аргууд</h3>
        {Object.entries(data.methods).map(([key, method]) => (
          <label
            key={key}
            className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-4 py-3 touch-manipulation"
          >
            <span className="text-sm font-medium text-slate-800">
              {method.label}
            </span>
            <input
              type="checkbox"
              checked={method.enabled}
              onChange={() => toggleMethod(key)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Ирээдүйн интеграци (placeholder)
        </h3>
        {data.integrations.map((item) => (
          <div
            key={item.key}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500">
                {item.configured ? "Тохируулсан" : "Тохируулаагүй"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={() => toggleIntegration(item.key)}
                  className="h-4 w-4"
                />
                Идэвхжүүлэх
              </label>
              <Button type="button" size="sm" variant="outline" disabled>
                <Settings className="mr-1 h-3.5 w-3.5" />
                Тохиргоо
              </Button>
            </div>
          </div>
        ))}
      </div>

      <SettingsFormActions
        saving={saving}
        onSave={() => void save()}
        onCancel={() => setData(snapshot)}
      />
    </SettingsSectionCard>
  );
}

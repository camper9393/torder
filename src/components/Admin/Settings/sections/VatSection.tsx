"use client";

import React from "react";
import toast from "react-hot-toast";

import SettingsFormActions from "@/components/Admin/Settings/SettingsFormActions";
import SettingsSectionCard from "@/components/Admin/Settings/SettingsSectionCard";
import { VAT_SETTINGS_DEFAULTS } from "@/components/Admin/Settings/settingsDefaults";
import { useSettingsApiParams } from "@/components/Admin/Settings/useSettingsApi";
import { Input } from "@/components/ui/input";
import {
  GET_ADMIN_SETTINGS_VAT,
  PATCH_ADMIN_SETTINGS_VAT,
} from "@/utils/APIConstant";
import { getApi, patchApi } from "@/utils/common";

type VatData = {
  companyName: string;
  registrationNumber: string;
  isVatPayer: boolean;
  taxPayerCode: string;
  ebarimtMerchantCode: string;
  vatEnabled: boolean;
};

export default function VatSection() {
  const settingsApiParam = useSettingsApiParams();
  const [form, setForm] = React.useState<VatData>(VAT_SETTINGS_DEFAULTS);
  const [snapshot, setSnapshot] = React.useState<VatData>(VAT_SETTINGS_DEFAULTS);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const applyPayload = React.useCallback((payload: Partial<VatData>) => {
    const next: VatData = {
      ...VAT_SETTINGS_DEFAULTS,
      ...payload,
    };
    setForm(next);
    setSnapshot(next);
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getApi<{ success: boolean; message?: string; data?: VatData }>({
        url: GET_ADMIN_SETTINGS_VAT,
        param: settingsApiParam,
      });
      if (res?.success && res.data) {
        applyPayload(res.data);
      } else {
        setLoadError(res?.message || "Тохиргоо ачаалахад алдаа гарлаа");
        applyPayload(VAT_SETTINGS_DEFAULTS);
      }
    } catch {
      setLoadError("Тохиргоо ачаалахад алдаа гарлаа");
      applyPayload(VAT_SETTINGS_DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, [applyPayload, settingsApiParam]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    const res = await patchApi<{ success: boolean; message?: string }>({
      url: PATCH_ADMIN_SETTINGS_VAT,
      values: form,
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
      <SettingsSectionCard title="НӨАТ">
        <p className="text-sm text-slate-500">Ачааллаж байна...</p>
      </SettingsSectionCard>
    );
  }

  return (
    <SettingsSectionCard
      title="НӨАТ / Ebarimt"
      description="Ирээдүйд Ebarimt API холболтод бэлэн бүтэц."
    >
      {loadError ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {loadError}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Байгууллагын нэр</label>
          <Input
            value={form.companyName}
            onChange={(e) =>
              setForm((f) => ({ ...f, companyName: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Регистрийн дугаар</label>
          <Input
            value={form.registrationNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, registrationNumber: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Татвар төлөгчийн код</label>
          <Input
            value={form.taxPayerCode}
            onChange={(e) =>
              setForm((f) => ({ ...f, taxPayerCode: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Ebarimt merchant code</label>
          <Input
            value={form.ebarimtMerchantCode}
            onChange={(e) =>
              setForm((f) => ({ ...f, ebarimtMerchantCode: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isVatPayer}
            onChange={(e) =>
              setForm((f) => ({ ...f, isVatPayer: e.target.checked }))
            }
          />
          НӨАТ төлөгч
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.vatEnabled}
            onChange={(e) =>
              setForm((f) => ({ ...f, vatEnabled: e.target.checked }))
            }
          />
          НӨАТ идэвхтэй
        </label>
      </div>

      <SettingsFormActions
        saving={saving}
        onSave={() => void save()}
        onCancel={() => setForm(snapshot)}
      />
    </SettingsSectionCard>
  );
}

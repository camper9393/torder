"use client";

import React from "react";
import toast from "react-hot-toast";

import ReceiptPreview from "@/components/Admin/Settings/sections/ReceiptPreview";
import {
  normalizeReceiptData,
  RECEIPT_FORM_DEFAULTS,
  RECEIPT_TOGGLE_OPTIONS,
  type ReceiptData,
} from "@/components/receipt/receiptTypes";
import SettingsFormActions from "@/components/Admin/Settings/SettingsFormActions";
import SettingsSectionCard from "@/components/Admin/Settings/SettingsSectionCard";
import { useSettingsApiParams } from "@/components/Admin/Settings/useSettingsApi";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  GET_ADMIN_SETTINGS_RECEIPT,
  PATCH_ADMIN_SETTINGS_RECEIPT,
} from "@/utils/APIConstant";
import { getApi, patchApi } from "@/utils/common";

function SegmentedControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-9 rounded-md px-4 text-sm font-medium transition touch-manipulation",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 touch-manipulation">
      <span className="text-sm text-slate-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-slate-900" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </label>
  );
}

export default function ReceiptSection() {
  const settingsApiParam = useSettingsApiParams();
  const [form, setForm] = React.useState<ReceiptData>(RECEIPT_FORM_DEFAULTS);
  const [snapshot, setSnapshot] = React.useState<ReceiptData>(
    RECEIPT_FORM_DEFAULTS
  );
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [previewRefreshToken, setPreviewRefreshToken] = React.useState(0);

  const applyPayload = React.useCallback((payload?: Partial<ReceiptData>) => {
    const next = normalizeReceiptData(payload);
    setForm(next);
    setSnapshot(next);
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getApi<{
        success: boolean;
        message?: string;
        data?: Partial<ReceiptData>;
      }>({
        url: GET_ADMIN_SETTINGS_RECEIPT,
        param: settingsApiParam,
      });
      if (res?.success && res.data) {
        applyPayload(res.data);
      } else {
        setLoadError(res?.message || "Тохиргоо ачаалахад алдаа гарлаа");
        applyPayload(RECEIPT_FORM_DEFAULTS);
      }
    } catch {
      setLoadError("Тохиргоо ачаалахад алдаа гарлаа");
      applyPayload(RECEIPT_FORM_DEFAULTS);
    } finally {
      setLoading(false);
      setPreviewRefreshToken((t) => t + 1);
    }
  }, [applyPayload, settingsApiParam]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const patch = <K extends keyof ReceiptData>(key: K, value: ReceiptData[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "showAddressPhone" && typeof value === "boolean") {
        next.showAddress = value;
        next.showPhone = value;
      }
      if (key === "additionalInfo" && typeof value === "string") {
        next.footerText = value;
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const payload = normalizeReceiptData(form);
    const res = await patchApi<{
      success: boolean;
      message?: string;
      data?: Partial<ReceiptData>;
    }>({
      url: PATCH_ADMIN_SETTINGS_RECEIPT,
      values: payload,
      param: settingsApiParam,
    });
    setSaving(false);
    if (!res?.success) {
      toast.error(res?.message || "Хадгалахад алдаа");
      return;
    }
    if (res.data) {
      applyPayload(res.data);
    }
    toast.success("Амжилттай хадгаллаа");
  };

  const cancel = () => {
    setForm(snapshot);
  };

  if (loading) {
    return (
      <SettingsSectionCard title="Баримт">
        <p className="text-sm text-slate-500">Ачааллаж байна...</p>
      </SettingsSectionCard>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
      {loadError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 xl:col-span-2">
          {loadError}
        </p>
      ) : null}

      <SettingsSectionCard
        title="Баримтын тохиргоо"
        description="POS баримтын хэмжээ, фонт, хэвлэх сонголтууд."
      >
        <div className="space-y-6">
          <SegmentedControl
            label="Баримтын хэмжээ"
            value={form.receiptSize}
            options={[
              { value: "80mm", label: "80mm" },
              { value: "58mm", label: "58mm" },
            ]}
            onChange={(v) => patch("receiptSize", v)}
          />

          <SegmentedControl
            label="Фонтын хэмжээ"
            value={form.fontSize}
            options={[
              { value: 10, label: "10" },
              { value: 12, label: "12" },
              { value: 14, label: "14" },
            ]}
            onChange={(v) => patch("fontSize", v)}
          />

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Хэвлэх сонголт</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {RECEIPT_TOGGLE_OPTIONS.map((item) => (
                <ToggleRow
                  key={item.key}
                  label={item.label}
                  checked={form[item.key]}
                  onChange={(checked) => patch(item.key, checked)}
                />
              ))}
            </div>
          </div>

          {form.showLogo ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800">
                Лого URL (заавал биш)
              </label>
              <Input
                placeholder="https://..."
                value={form.logoUrl}
                onChange={(e) => patch("logoUrl", e.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">
              Талархал / Thank you message
            </label>
            <Input
              placeholder="Баярлалаа! Дахин тавтай морилно уу."
              value={form.thankYouMessage}
              onChange={(e) => patch("thankYouMessage", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">
              Нэмэлт мэдээлэл
            </label>
            <textarea
              rows={3}
              placeholder="Баримтын доод хэсэгт харагдах нэмэлт текст..."
              value={form.additionalInfo}
              onChange={(e) => patch("additionalInfo", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800">
              Рестораны нэр (толгой хэсэг)
            </label>
            <Input
              placeholder="Жишээ: T Order Restaurant"
              value={form.headerText}
              onChange={(e) => patch("headerText", e.target.value)}
            />
          </div>
        </div>

        <SettingsFormActions
          saving={saving}
          onSave={() => void save()}
          onCancel={cancel}
        />
      </SettingsSectionCard>

      <div className="xl:sticky xl:top-6 xl:self-start">
        <SettingsSectionCard
          title="Урьдчилан харах"
          description="Тохиргоо өөрчлөхөд шууд шинэчлэгдэнэ."
        >
          <ReceiptPreview settings={form} refreshToken={previewRefreshToken} />
        </SettingsSectionCard>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import toast from "react-hot-toast";
import { Pencil, RefreshCw } from "lucide-react";

import SettingsFormActions from "@/components/Admin/Settings/SettingsFormActions";
import SettingsSectionCard from "@/components/Admin/Settings/SettingsSectionCard";
import { useSettingsApiParams } from "@/components/Admin/Settings/useSettingsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GET_ADMIN_SETTINGS_COMPANY,
  PATCH_ADMIN_SETTINGS_COMPANY,
} from "@/utils/APIConstant";
import { getApi, patchApi } from "@/utils/common";

type CompanyData = {
  nameMn: string;
  nameEn: string;
  logoUrl: string;
  businessType: string;
  introduction: string;
  description: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  address: string;
  googleMapLink: string;
};

const EMPTY: CompanyData = {
  nameMn: "",
  nameEn: "",
  logoUrl: "",
  businessType: "",
  introduction: "",
  description: "",
  phone1: "",
  phone2: "",
  email: "",
  website: "",
  facebook: "",
  instagram: "",
  address: "",
  googleMapLink: "",
};

const VIEW_ROWS: { key: keyof CompanyData; label: string }[] = [
  { key: "nameMn", label: "Байгууллагын нэр" },
  { key: "nameEn", label: "Англи нэр" },
  { key: "businessType", label: "Үйл ажиллагааны төрөл" },
  { key: "introduction", label: "Танилцуулга" },
  { key: "description", label: "Дэлгэрэнгүй тайлбар" },
  { key: "phone1", label: "Утас 1" },
  { key: "phone2", label: "Утас 2" },
  { key: "email", label: "Имэйл" },
  { key: "website", label: "Веб сайт" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "address", label: "Хаяг" },
  { key: "googleMapLink", label: "Google map link" },
  { key: "logoUrl", label: "Лого URL" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function displayValue(value: string) {
  const trimmed = value.trim();
  return trimmed || "—";
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  const trimmed = value.trim();
  const isLink =
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:");

  return (
    <div className="grid gap-1 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-900 break-words">
        {isLink ? (
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-900 underline decoration-slate-300 underline-offset-2 hover:decoration-slate-600"
          >
            {trimmed}
          </a>
        ) : (
          displayValue(value)
        )}
      </dd>
    </div>
  );
}

export default function CompanySettingsSection() {
  const settingsApiParam = useSettingsApiParams();
  const [form, setForm] = React.useState<CompanyData>(EMPTY);
  const [snapshot, setSnapshot] = React.useState<CompanyData>(EMPTY);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const load = React.useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const res = await getApi<{
        success: boolean;
        message?: string;
        data?: CompanyData;
      }>({
        url: GET_ADMIN_SETTINGS_COMPANY,
        param: settingsApiParam,
      });

      if (res?.success && res.data) {
        setForm(res.data);
        setSnapshot(res.data);
      } else if (!options?.silent) {
        toast.error(res?.message || "Мэдээлэл ачаалахад алдаа гарлаа");
      }

      if (!options?.silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    },
    [settingsApiParam]
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  const set = (key: keyof CompanyData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const startEdit = () => {
    setForm(snapshot);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setForm(snapshot);
    setIsEditing(false);
  };

  const save = async () => {
    setSaving(true);
    const res = await patchApi<{
      success: boolean;
      message?: string;
      data?: CompanyData;
    }>({
      url: PATCH_ADMIN_SETTINGS_COMPANY,
      values: form,
      param: settingsApiParam,
    });
    setSaving(false);
    if (!res?.success) {
      toast.error(res?.message || "Хадгалахад алдаа");
      return;
    }
    if (res.data) {
      setForm(res.data);
      setSnapshot(res.data);
    }
    setIsEditing(false);
    toast.success("Амжилттай хадгаллаа");
  };

  if (loading) {
    return (
      <SettingsSectionCard title="Байгууллагын мэдээлэл">
        <p className="text-sm text-slate-500">Ачааллаж байна...</p>
      </SettingsSectionCard>
    );
  }

  return (
    <SettingsSectionCard
      title="Байгууллагын мэдээлэл"
      description={
        isEditing
          ? "Мэдээллээ засаад хадгална уу."
          : "Ресторан / компанийн үндсэн профайл."
      }
    >
      {!isEditing ? (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
            <dl>
              {VIEW_ROWS.map((row) => (
                <ReadOnlyRow
                  key={row.key}
                  label={row.label}
                  value={snapshot[row.key]}
                />
              ))}
            </dl>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Button
              type="button"
              onClick={startEdit}
              className="min-h-10 bg-slate-900 hover:bg-slate-800 touch-manipulation"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Засах
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void load({ silent: true })}
              disabled={refreshing}
              className="min-h-10 touch-manipulation"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Шинэчилж байна..." : "Шинэчлэх"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Байгууллагын нэр">
              <Input
                value={form.nameMn}
                onChange={(e) => set("nameMn", e.target.value)}
              />
            </Field>
            <Field label="Англи нэр">
              <Input
                value={form.nameEn}
                onChange={(e) => set("nameEn", e.target.value)}
              />
            </Field>
            <Field label="Лого (URL)">
              <Input
                value={form.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Үйл ажиллагааны төрөл">
              <Input
                value={form.businessType}
                onChange={(e) => set("businessType", e.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Танилцуулга">
                <Input
                  value={form.introduction}
                  onChange={(e) => set("introduction", e.target.value)}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Дэлгэрэнгүй тайлбар">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </Field>
            </div>
            <Field label="Утас 1">
              <Input
                value={form.phone1}
                onChange={(e) => set("phone1", e.target.value)}
              />
            </Field>
            <Field label="Утас 2">
              <Input
                value={form.phone2}
                onChange={(e) => set("phone2", e.target.value)}
              />
            </Field>
            <Field label="Имэйл">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Веб сайт">
              <Input
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </Field>
            <Field label="Facebook">
              <Input
                value={form.facebook}
                onChange={(e) => set("facebook", e.target.value)}
              />
            </Field>
            <Field label="Instagram">
              <Input
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Хаяг">
                <Input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Google map link">
                <Input
                  value={form.googleMapLink}
                  onChange={(e) => set("googleMapLink", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <SettingsFormActions
            saving={saving}
            onSave={() => void save()}
            onCancel={cancelEdit}
          />
        </>
      )}
    </SettingsSectionCard>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlatformCard,
  PlatformLoading,
  PlatformPageHeader,
} from "@/components/Platform/shared";
import { GET_PLATFORM_SETTINGS, PATCH_PLATFORM_SETTINGS } from "@/utils/APIConstant";
import { getApi, patchApi } from "@/utils/common";
import React from "react";

export default function PlatformSettingsPage() {
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState("");
  const [form, setForm] = React.useState({
    platformName: "",
    supportEmail: "",
    defaultTrialDays: "30",
    defaultMaxTables: "30",
    defaultMaxUsers: "10",
    currency: "MNT",
  });

  React.useEffect(() => {
    void (async () => {
      const res = await getApi<{
        success: boolean;
        data?: typeof form & { defaultTrialDays: number };
      }>({ url: GET_PLATFORM_SETTINGS });
      if (res?.success && res.data) {
        setForm({
          platformName: res.data.platformName,
          supportEmail: res.data.supportEmail,
          defaultTrialDays: String(res.data.defaultTrialDays),
          defaultMaxTables: String(res.data.defaultMaxTables),
          defaultMaxUsers: String(res.data.defaultMaxUsers),
          currency: res.data.currency,
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await patchApi<{ success: boolean; message?: string }>({
      url: PATCH_PLATFORM_SETTINGS,
      values: {
        ...form,
        defaultTrialDays: Number(form.defaultTrialDays),
        defaultMaxTables: Number(form.defaultMaxTables),
        defaultMaxUsers: Number(form.defaultMaxUsers),
      },
    });
    setMessage(res?.message || "Амжилттай хадгаллаа");
  };

  if (loading) return <PlatformLoading />;

  return (
    <div className="space-y-6">
      <PlatformPageHeader title="Тохиргоо" />
      <PlatformCard>
        <form onSubmit={save} className="grid max-w-xl gap-4">
          {(
            [
              ["platformName", "Platform нэр"],
              ["supportEmail", "Support имэйл"],
              ["defaultTrialDays", "Trial хоног"],
              ["defaultMaxTables", "Default maxTables"],
              ["defaultMaxUsers", "Default maxUsers"],
              ["currency", "Валют"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-medium">{label}</label>
              <Input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          <Button type="submit" className="w-fit">
            Хадгалах
          </Button>
        </form>
      </PlatformCard>
    </div>
  );
}

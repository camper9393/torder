"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlatformCard,
  PlatformEmpty,
  PlatformLoading,
  PlatformPageHeader,
} from "@/components/Platform/shared";
import {
  GET_PLATFORM_SUPPORT,
  PATCH_PLATFORM_SUPPORT,
  POST_PLATFORM_SUPPORT,
} from "@/utils/APIConstant";
import { getApi, patchApi, postApi } from "@/utils/common";
import React from "react";

type Ticket = {
  _id: string;
  restaurantName?: string;
  title: string;
  message: string;
  status: string;
  priority: string;
  type: string;
  adminNote?: string;
};

export default function PlatformSupportPage() {
  const [items, setItems] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [form, setForm] = React.useState({
    restaurantId: "",
    title: "",
    message: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getApi<{ success: boolean; data?: Ticket[] }>({
      url: GET_PLATFORM_SUPPORT,
    });
    if (res?.success && res.data) setItems(res.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await patchApi({ url: PATCH_PLATFORM_SUPPORT(id), values: { status } });
    await load();
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    await postApi({ url: POST_PLATFORM_SUPPORT, values: form });
    setForm({ restaurantId: "", title: "", message: "" });
    await load();
  };

  return (
    <div className="space-y-6">
      <PlatformPageHeader title="Зөвлөгөө, Support" />
      <PlatformCard>
        <h2 className="mb-3 font-semibold">Support үүсгэх</h2>
        <form onSubmit={createTicket} className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Restaurant ID"
            value={form.restaurantId}
            onChange={(e) => setForm((f) => ({ ...f, restaurantId: e.target.value }))}
            required
          />
          <Input
            placeholder="Гарчиг"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <Input
            className="md:col-span-2"
            placeholder="Мессеж"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            required
          />
          <Button type="submit" className="w-fit">
            Үүсгэх
          </Button>
        </form>
      </PlatformCard>

      {loading ? <PlatformLoading /> : null}
      {!loading && items.length === 0 ? <PlatformEmpty /> : null}

      {!loading && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((t) => (
            <PlatformCard key={t._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="text-sm text-slate-500">{t.restaurantName}</p>
                  <p className="mt-2 text-sm">{t.message}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {t.type} · {t.priority} · {t.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void updateStatus(t._id, "inProgress")}>
                    Ажиллаж байна
                  </Button>
                  <Button size="sm" onClick={() => void updateStatus(t._id, "resolved")}>
                    Шийдсэн
                  </Button>
                </div>
              </div>
            </PlatformCard>
          ))}
        </div>
      ) : null}
    </div>
  );
}

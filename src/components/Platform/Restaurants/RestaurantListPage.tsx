"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlatformPageHeader,
} from "@/components/Platform/shared";
import {
  formatMnDate,
  PlanBadge,
  RestaurantAvatar,
  RestaurantStatusBadges,
  subscriptionLabel,
} from "@/components/Platform/Restaurants/restaurantUi";
import type { Restaurant, RestaurantPlan } from "@/types/restaurant";
import {
  GET_PLATFORM_RESTAURANTS,
  POST_PLATFORM_RESTAURANT,
} from "@/utils/APIConstant";
import { getApi, postApi } from "@/utils/common";
import { ChevronRight, Mail, Phone, Users } from "lucide-react";
import Link from "next/link";
import React from "react";

type EnrichedRestaurant = Restaurant & {
  usersCount?: number;
  tablesCount?: number;
  menuItemsCount?: number;
  ordersCount?: number;
  hasPendingPayment?: boolean;
  daysRemaining?: number;
  displayId?: string;
};

type ApiListResponse = {
  success: boolean;
  message: string;
  data?: EnrichedRestaurant[];
};

type ApiCreateResponse = {
  success: boolean;
  message: string;
  data?: Restaurant;
};

export default function RestaurantListPage() {
  const [restaurants, setRestaurants] = React.useState<EnrichedRestaurant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [error, setError] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [planFilter, setPlanFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    ownerUsername: "",
    ownerPassword: "",
    plan: "business" as RestaurantPlan,
    expireDate: "",
    maxTables: "30",
    maxUsers: "10",
  });

  const loadRestaurants = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await getApi<ApiListResponse>({
      url: GET_PLATFORM_RESTAURANTS,
      param: {
        ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        ...(planFilter !== "all" ? { plan: planFilter } : {}),
        ...(search ? { search } : {}),
      },
    });
    if (res?.success && res.data) {
      setRestaurants(res.data);
    } else {
      setError(res?.message || "Алдаа гарлаа");
    }
    setLoading(false);
  }, [statusFilter, planFilter, search]);

  React.useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    const res = await postApi<ApiCreateResponse>({
      url: POST_PLATFORM_RESTAURANT,
      values: form,
    });

    if (!res?.success) {
      setError(res?.message || "Ресторан үүсгэхэд алдаа гарлаа");
      setCreating(false);
      return;
    }

    setForm({
      name: "",
      ownerName: "",
      email: "",
      phone: "",
      address: "",
      ownerUsername: "",
      ownerPassword: "",
      plan: "business",
      expireDate: "",
      maxTables: "30",
      maxUsers: "10",
    });
    setShowCreate(false);
    await loadRestaurants();
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PlatformPageHeader
          title="Ресторанууд"
          description="Бүртгэлтэй ресторануудыг удирдах, шинэ ресторан нэмэх"
        />
        <Button onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Хаах" : "+ Шинэ ресторан"}
        </Button>
      </div>

      {showCreate ? (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">Шинэ ресторан үүсгэх</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Рестораны нэр *</label>
              <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Эзэмшигчийн нэр *</label>
              <Input required value={form.ownerName} onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Имэйл *</label>
              <Input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Утас *</label>
              <Input required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Хаяг</label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Багц</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.plan}
                onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value as RestaurantPlan }))}
              >
                <option value="starter">Starter</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Дуусах огноо</label>
              <Input type="date" value={form.expireDate} onChange={(e) => setForm((f) => ({ ...f, expireDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Ширээний дээд тоо</label>
              <Input type="number" min="1" value={form.maxTables} onChange={(e) => setForm((f) => ({ ...f, maxTables: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Хэрэглэгчийн дээд тоо</label>
              <Input type="number" min="1" value={form.maxUsers} onChange={(e) => setForm((f) => ({ ...f, maxUsers: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Эзэмшигчийн username *</label>
              <Input required value={form.ownerUsername} onChange={(e) => setForm((f) => ({ ...f, ownerUsername: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Түр нууц үг *</label>
              <Input required type="password" minLength={6} value={form.ownerPassword} onChange={(e) => setForm((f) => ({ ...f, ownerPassword: e.target.value }))} />
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={creating}>
            {creating ? "Үүсгэж байна..." : "Ресторан үүсгэх"}
          </Button>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Input placeholder="Хайх (нэр, эзэмшигч, имэйл, утас)..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <select className="h-10 rounded-md border px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Бүх төлөв</option>
          <option value="active">Идэвхтэй</option>
          <option value="expired">Хугацаа дууссан</option>
          <option value="suspended">Түдгэлзсэн</option>
          <option value="inactive">Идэвхгүй</option>
        </select>
        <select className="h-10 rounded-md border px-3 text-sm" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
          <option value="all">Бүх багц</option>
          <option value="starter">Starter</option>
          <option value="business">Business</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <Button type="button" variant="outline" onClick={() => void loadRestaurants()}>
          Шүүх
        </Button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">Ачааллаж байна...</p>
      ) : error && !showCreate ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : restaurants.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          Мэдээлэл байхгүй байна
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {restaurants.map((r) => (
            <Link
              key={r._id}
              href={`/platform/restaurants/${r._id}`}
              className="group block rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex gap-4">
                <RestaurantAvatar name={r.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">
                        {r.name}
                      </span>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {r.displayId ?? r._id.slice(-8)} · /{r.slug}
                      </p>
                    </div>
                    <PlanBadge plan={r.plan} />
                  </div>
                  <div className="mt-2">
                    <RestaurantStatusBadges restaurant={r} />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{r.ownerName}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {r.email}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {r.phone}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>Захиалга: {subscriptionLabel(r.subscriptionStatus)}</span>
                    <span>·</span>
                    <span>Дуусах: {formatMnDate(r.expireDate)}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg bg-slate-50 p-3 text-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{r.usersCount ?? 0}</p>
                      <p className="text-slate-500">Хэрэглэгч</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{r.tablesCount ?? 0}</p>
                      <p className="text-slate-500">Ширээ</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{r.menuItemsCount ?? 0}</p>
                      <p className="text-slate-500">Цэс</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{r.ordersCount ?? 0}</p>
                      <p className="text-slate-500">Захиалга</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                      Дэлгэрэнгүй
                      <ChevronRight className="h-4 w-4" />
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Users className="h-3 w-3" />
                      {r.ownerName}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

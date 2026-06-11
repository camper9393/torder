"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Restaurant } from "@/types/restaurant";
import {
  PATCH_PLATFORM_RESTAURANT,
  POST_PLATFORM_RESTAURANT_ACTIVATE,
  POST_PLATFORM_RESTAURANT_DEACTIVATE,
  platformRestaurantById,
} from "@/utils/APIConstant";
import { getApi, patchApi, postApi } from "@/utils/common";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

type ApiResponse = {
  success: boolean;
  message: string;
  data?: Restaurant;
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("mn-MN");
  } catch {
    return value;
  }
}

export default function RestaurantDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
  });

  const loadRestaurant = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await getApi<ApiResponse>({ url: platformRestaurantById(id) });
    if (res?.success && res.data) {
      setRestaurant(res.data);
      setForm({
        name: res.data.name,
        ownerName: res.data.ownerName,
        email: res.data.email,
        phone: res.data.phone,
        address: res.data.address,
      });
    } else {
      setError(res?.message || "Ресторан олдсонгүй");
    }
    setLoading(false);
  }, [id]);

  React.useEffect(() => {
    void loadRestaurant();
  }, [loadRestaurant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await patchApi<ApiResponse>({
      url: PATCH_PLATFORM_RESTAURANT(id),
      values: form,
    });

    if (!res?.success) {
      setError(res?.message || "Хадгалахад алдаа гарлаа");
      setSaving(false);
      return;
    }

    if (res.data) setRestaurant(res.data);
    setSaving(false);
  };

  const handleActivate = async () => {
    setSaving(true);
    const res = await postApi<ApiResponse>({
      url: POST_PLATFORM_RESTAURANT_ACTIVATE(id),
    });
    if (!res?.success) {
      setError(res?.message || "Идэвхжүүлэхэд алдаа гарлаа");
    } else if (res.data) {
      setRestaurant(res.data);
    }
    setSaving(false);
  };

  const handleDeactivate = async () => {
    setSaving(true);
    const res = await postApi<ApiResponse>({
      url: POST_PLATFORM_RESTAURANT_DEACTIVATE(id),
    });
    if (!res?.success) {
      setError(res?.message || "Идэвхгүй болгоход алдаа гарлаа");
    } else if (res.data) {
      setRestaurant(res.data);
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="p-6 text-sm text-zinc-500">Ачааллаж байна...</p>;
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <p className="text-sm text-red-600">{error || "Ресторан олдсонгүй"}</p>
        <Button variant="outline" onClick={() => router.push("/platform/restaurants")}>
          Буцах
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/platform/restaurants"
            className="text-sm text-orange-600 hover:underline"
          >
            ← Жагсаалт руу буцах
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{restaurant.name}</h1>
          <p className="text-sm text-zinc-500">/{restaurant.slug}</p>
        </div>
        <div className="flex gap-2">
          {restaurant.isActive ? (
            <Button variant="destructive" disabled={saving} onClick={handleDeactivate}>
              Идэвхгүй болгох
            </Button>
          ) : (
            <Button disabled={saving} onClick={handleActivate}>
              Идэвхжүүлэх
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">Мэдээлэл</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Төлөвлөгөө</dt>
            <dd className="font-medium">{restaurant.plan}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Захиалгын төлөв</dt>
            <dd className="font-medium">{restaurant.subscriptionStatus}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Эхлэх огноо</dt>
            <dd className="font-medium">{formatDate(restaurant.startDate)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Дуусах огноо</dt>
            <dd className="font-medium">{formatDate(restaurant.expireDate)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Хамгийн их ширээ</dt>
            <dd className="font-medium">{restaurant.maxTables}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Хамгийн их хэрэглэгч</dt>
            <dd className="font-medium">{restaurant.maxUsers}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Төлөв</dt>
            <dd className="font-medium">{restaurant.isActive ? "Идэвхтэй" : "Идэвхгүй"}</dd>
          </div>
        </dl>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-medium text-zinc-900">Засах</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Рестораны нэр</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Эзэмшигчийн нэр</label>
            <Input
              value={form.ownerName}
              onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Имэйл</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Утас</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-zinc-700">Хаяг</label>
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </form>
    </div>
  );
}

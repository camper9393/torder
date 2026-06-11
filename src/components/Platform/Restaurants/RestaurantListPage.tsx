"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Restaurant } from "@/types/restaurant";
import {
  GET_PLATFORM_RESTAURANTS,
  POST_PLATFORM_RESTAURANT,
} from "@/utils/APIConstant";
import { getApi, postApi } from "@/utils/common";
import Link from "next/link";
import React from "react";

type ApiListResponse = {
  success: boolean;
  message: string;
  data?: Restaurant[];
};

type ApiCreateResponse = {
  success: boolean;
  message: string;
  data?: Restaurant;
};

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("mn-MN");
  } catch {
    return value;
  }
}

export default function RestaurantListPage() {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
  });

  const loadRestaurants = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await getApi<ApiListResponse>({ url: GET_PLATFORM_RESTAURANTS });
    if (res?.success && res.data) {
      setRestaurants(res.data);
    } else {
      setError(res?.message || "Жагсаалт ачаалахад алдаа гарлаа");
    }
    setLoading(false);
  }, []);

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

    setForm({ name: "", ownerName: "", email: "", phone: "", address: "" });
    await loadRestaurants();
    setCreating(false);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Ресторанууд</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Platform owner — ресторан бүртгэл, идэвхжүүлэх, идэвхгүй болгох
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-medium text-zinc-900">Шинэ ресторан үүсгэх</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Рестораны нэр *</label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Эзэмшигчийн нэр *</label>
            <Input
              required
              value={form.ownerName}
              onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Имэйл *</label>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Утас *</label>
            <Input
              required
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
        <Button type="submit" disabled={creating}>
          {creating ? "Үүсгэж байна..." : "Ресторан үүсгэх"}
        </Button>
      </form>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-medium text-zinc-900">Бүртгэлтэй ресторанууд</h2>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-zinc-500">Ачааллаж байна...</p>
        ) : restaurants.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Одоогоор ресторан бүртгэгдээгүй байна.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Нэр</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Эзэмшигч</th>
                  <th className="px-4 py-3 font-medium">Төлөвлөгөө</th>
                  <th className="px-4 py-3 font-medium">Захиалга</th>
                  <th className="px-4 py-3 font-medium">Төлөв</th>
                  <th className="px-4 py-3 font-medium">Дуусах</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r._id} className="border-t border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">{r.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{r.slug}</td>
                    <td className="px-4 py-3">{r.ownerName}</td>
                    <td className="px-4 py-3">{r.plan}</td>
                    <td className="px-4 py-3">{r.subscriptionStatus}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.isActive
                            ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
                            : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                        }
                      >
                        {r.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(r.expireDate)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/platform/restaurants/${r._id}`}
                        className="text-orange-600 hover:underline"
                      >
                        Дэлгэрэнгүй
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

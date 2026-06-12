"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlatformCard,
  PlatformEmpty,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
} from "@/components/Platform/shared";
import {
  GET_PLATFORM_PAYMENTS,
  PATCH_PLATFORM_PAYMENT,
  POST_PLATFORM_PAYMENT,
} from "@/utils/APIConstant";
import { getApi, patchApi, postApi } from "@/utils/common";
import React from "react";

type Payment = {
  _id: string;
  restaurantName?: string;
  amount: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt?: string | null;
};

export default function PlatformPaymentsPage() {
  const [items, setItems] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({
    restaurantId: "",
    amount: "",
    note: "",
  });

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getApi<{ success: boolean; data?: Payment[] }>({
      url: GET_PLATFORM_PAYMENTS,
    });
    if (res?.success && res.data) setItems(res.data);
    else setError("Алдаа гарлаа");
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const markPaid = async (id: string) => {
    await patchApi({
      url: PATCH_PLATFORM_PAYMENT(id),
      values: { status: "paid", extendMonths: 1 },
    });
    await load();
  };

  const createPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await postApi({
      url: POST_PLATFORM_PAYMENT,
      values: form,
    });
    if (!res) {
      setError("Алдаа гарлаа");
      return;
    }
    setForm({ restaurantId: "", amount: "", note: "" });
    await load();
  };

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Төлбөр, тооцоо"
        description="Гараар бүртгэх төлбөрийн удирдлага"
      />

      <PlatformCard>
        <h2 className="mb-3 font-semibold">Шинэ төлбөр бүртгэх</h2>
        <form onSubmit={createPayment} className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Restaurant ID"
            value={form.restaurantId}
            onChange={(e) => setForm((f) => ({ ...f, restaurantId: e.target.value }))}
            required
          />
          <Input
            placeholder="Дүн"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <Input
            placeholder="Тэмдэглэл"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
          <Button type="submit" className="md:col-span-3 w-fit">
            Бүртгэх
          </Button>
        </form>
      </PlatformCard>

      {loading ? <PlatformLoading /> : null}
      {error ? <PlatformError message={error} /> : null}
      {!loading && items.length === 0 ? <PlatformEmpty /> : null}

      {!loading && items.length > 0 ? (
        <PlatformCard className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Ресторан</th>
                <th className="px-4 py-3 text-left">Дүн</th>
                <th className="px-4 py-3 text-left">Төлөв</th>
                <th className="px-4 py-3 text-left">Хугацаа</th>
                <th className="px-4 py-3 text-left">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{p.restaurantName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {p.amount.toLocaleString()} {p.currency}
                  </td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3">
                    {new Date(p.dueDate).toLocaleDateString("mn-MN")}
                  </td>
                  <td className="px-4 py-3">
                    {p.status !== "paid" ? (
                      <Button size="sm" onClick={() => void markPaid(p._id)}>
                        Төлсөн
                      </Button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PlatformCard>
      ) : null}
    </div>
  );
}

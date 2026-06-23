"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS_MN, UserRole } from "@/constants/userRoles";
import {
  EmptySection,
  formatMnDate,
  formatMnDateTime,
  InfoCard,
  InfoRow,
  PlanBadge,
  RestaurantAvatar,
  RestaurantStatusBadges,
  subscriptionLabel,
} from "@/components/Platform/Restaurants/restaurantUi";
import type { Restaurant, RestaurantPlan, SubscriptionStatus } from "@/types/restaurant";
import {
  DELETE_PLATFORM_RESTAURANT,
  GET_PLATFORM_RESTAURANT_PAYMENTS,
  GET_PLATFORM_RESTAURANT_SUMMARY,
  GET_PLATFORM_RESTAURANT_SUPPORT,
  PATCH_PLATFORM_PAYMENT,
  PATCH_PLATFORM_RESTAURANT,
  PATCH_PLATFORM_SUPPORT,
  PATCH_PLATFORM_USER,
  POST_PLATFORM_PAYMENT,
  POST_PLATFORM_RESTAURANT_ACTIVATE,
  POST_PLATFORM_RESTAURANT_DEACTIVATE,
  POST_PLATFORM_RESTAURANT_ENTER_SYSTEM,
  POST_PLATFORM_RESTAURANT_EXTEND_SHORT,
  POST_PLATFORM_RESTAURANT_RESET_OWNER_PASSWORD,
  POST_PLATFORM_SUPPORT,
  POST_PLATFORM_USER_RESET_PASSWORD,
} from "@/utils/APIConstant";
import { deleteApi, getApi, patchApi, postApi } from "@/utils/common";
import { notifyRestaurantInfoUpdated } from "@/utils/restaurantInfoRefresh";
import toast from "react-hot-toast";
import {
  ConfirmDialog,
  PlatformQuickAction,
  PlatformTabs,
  PlatformLoading,
} from "@/components/Platform/shared";
import {
  AlertTriangle,
  CreditCard,
  ExternalLink,
  Headphones,
  KeyRound,
  Pencil,
  RefreshCw,
  Settings,
  Shield,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const TABS = [
  { id: "general", label: "Ерөнхий мэдээлэл" },
  { id: "users", label: "Хэрэглэгчид" },
  { id: "payments", label: "Төлбөр, тооцоо" },
  { id: "system", label: "Систем мэдээлэл" },
  { id: "support", label: "Support" },
  { id: "settings", label: "Тохиргоо" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type SummaryData = {
  restaurant: Restaurant;
  displayId: string;
  usage: {
    usersCount: number;
    staffCount: number;
    tablesCount: number;
    menuItemsCount: number;
    ordersCount: number;
    todayOrders: number;
    monthlyOrders: number;
    lastActivityDate: string | null;
  };
  subscription: {
    plan: string;
    subscriptionStatus: string;
    startDate: string;
    expireDate: string;
    daysRemaining: number;
    maxTables: number;
    maxUsers: number;
  };
  billing: {
    plan: string;
    monthlyPrice: number;
    lastPaymentDate: string | null;
    nextDueDate: string;
    paymentStatus: string;
    hasPendingPayment: boolean;
  };
  system: {
    restaurantId: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
    maxTables: number;
    currentTables: number;
    maxUsers: number;
    currentUsers: number;
    menuItems: number;
    orders: number;
    tenantScope: string;
  };
  warnings: string[];
  users: {
    _id: string;
    name: string;
    username: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
  }[];
  owner: { _id: string; name: string; username: string; email: string } | null;
};

export default function RestaurantDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const [tab, setTab] = React.useState<TabId>("general");
  const [summary, setSummary] = React.useState<SummaryData | null>(null);
  const [payments, setPayments] = React.useState<
    { _id: string; amount: number; status: string; dueDate: string; paidAt?: string | null }[]
  >([]);
  const [tickets, setTickets] = React.useState<
    { _id: string; title: string; type: string; priority: string; status: string; createdAt: string; message: string }[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [showDelete, setShowDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [ownerPassword, setOwnerPassword] = React.useState("");
  const [userResetId, setUserResetId] = React.useState<string | null>(null);
  const [userResetPassword, setUserResetPassword] = React.useState("");
  const [supportForm, setSupportForm] = React.useState({ title: "", message: "" });
  const [settingsForm, setSettingsForm] = React.useState({
    name: "",
    ownerName: "",
    email: "",
    phone: "",
    phone2: "",
    address: "",
    englishName: "",
    logoUrl: "",
    businessType: "",
    description: "",
    detailDescription: "",
    website: "",
    facebook: "",
    instagram: "",
    googleMapLink: "",
    plan: "business" as RestaurantPlan,
    maxTables: "30",
    maxUsers: "10",
    subscriptionStatus: "active" as SubscriptionStatus,
    expireDate: "",
    isActive: true,
  });

  const loadSummary = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await getApi<{ success: boolean; data?: SummaryData; message?: string }>({
      url: GET_PLATFORM_RESTAURANT_SUMMARY(id),
    });
    if (!res?.success || !res.data) {
      setError(res?.message || "Ресторан олдсонгүй");
      setSummary(null);
    } else {
      setSummary(res.data);
      const r = res.data.restaurant;
      setSettingsForm({
        name: r.name,
        ownerName: r.ownerName,
        email: r.email,
        phone: r.phone,
        phone2: r.phone2 ?? "",
        address: r.address,
        englishName: r.englishName ?? "",
        logoUrl: r.logoUrl ?? "",
        businessType: r.businessType ?? "",
        description: r.description ?? "",
        detailDescription: r.detailDescription ?? "",
        website: r.website ?? "",
        facebook: r.facebook ?? "",
        instagram: r.instagram ?? "",
        googleMapLink: r.googleMapLink ?? "",
        plan: r.plan,
        maxTables: String(r.maxTables),
        maxUsers: String(r.maxUsers),
        subscriptionStatus: r.subscriptionStatus,
        expireDate: r.expireDate.slice(0, 10),
        isActive: r.isActive,
      });
    }
    setLoading(false);
  }, [id]);

  const loadPayments = React.useCallback(async () => {
    const res = await getApi<{
      success: boolean;
      data?: { payments: typeof payments };
    }>({ url: GET_PLATFORM_RESTAURANT_PAYMENTS(id) });
    if (res?.success && res.data) setPayments(res.data.payments);
  }, [id]);

  const loadSupport = React.useCallback(async () => {
    const res = await getApi<{
      success: boolean;
      data?: { tickets: typeof tickets };
    }>({ url: GET_PLATFORM_RESTAURANT_SUPPORT(id) });
    if (res?.success && res.data) setTickets(res.data.tickets);
  }, [id]);

  React.useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  React.useEffect(() => {
    if (tab === "payments") void loadPayments();
    if (tab === "support") void loadSupport();
  }, [tab, loadPayments, loadSupport]);

  const restaurant = summary?.restaurant;

  const handleEnterSystem = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await postApi<{
        success: boolean;
        message?: string;
        data?: { redirectPath?: string };
      }>({
        url: POST_PLATFORM_RESTAURANT_ENTER_SYSTEM(id),
      });

      if (!res?.success) {
        setError(res?.message || "Системд нэвтрэхэд алдаа гарлаа");
        return;
      }

      const redirectPath = res.data?.redirectPath || "/admin/dashboard";
      const targetUrl = new URL(redirectPath, window.location.origin).href;
      const opened = window.open(targetUrl, "_blank", "noopener,noreferrer");

      if (!opened) {
        toast.error("Шинэ цонх нээж чадсангүй");
        return;
      }
    } catch {
      setError("Системд нэвтрэхэд алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleExtend = async () => {
    setSaving(true);
    setSuccess("");
    const res = await postApi<{ success: boolean; message?: string }>({
      url: POST_PLATFORM_RESTAURANT_EXTEND_SHORT(id),
      values: { months: 1 },
    });
    if (!res?.success) setError(res?.message || "Алдаа гарлаа");
    else {
      setSuccess(res.message || "Амжилттай хадгаллаа");
      await loadSummary();
    }
    setSaving(false);
  };

  const handleToggleActive = async () => {
    if (!restaurant) return;
    setSaving(true);
    const res = await postApi<{ success: boolean }>({
      url: restaurant.isActive
        ? POST_PLATFORM_RESTAURANT_DEACTIVATE(id)
        : POST_PLATFORM_RESTAURANT_ACTIVATE(id),
    });
    if (res?.success) await loadSummary();
    else setError("Алдаа гарлаа");
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteApi<{ success: boolean; message?: string }>({
      url: DELETE_PLATFORM_RESTAURANT(id),
    });
    setDeleting(false);
    if (!res?.success) {
      toast.error(res?.message || "Устгахад алдаа гарлаа");
      return;
    }
    toast.success(res.message || "Ресторан устгагдлаа");
    setShowDelete(false);
    router.push("/platform/restaurants");
  };

  const handleOwnerReset = async () => {
    if (!ownerPassword) return;
    setSaving(true);
    const res = await postApi<{ success: boolean; message?: string }>({
      url: POST_PLATFORM_RESTAURANT_RESET_OWNER_PASSWORD(id),
      values: { password: ownerPassword },
    });
    if (!res?.success) setError(res?.message || "Алдаа гарлаа");
    else {
      setSuccess(res.message || "Амжилттай хадгаллаа");
      setOwnerPassword("");
    }
    setSaving(false);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    const res = await patchApi<{ success: boolean; message?: string }>({
      url: PATCH_PLATFORM_RESTAURANT(id),
      values: {
        ...settingsForm,
        maxTables: Number(settingsForm.maxTables),
        maxUsers: Number(settingsForm.maxUsers),
      },
    });
    if (!res?.success) setError(res?.message || "Алдаа гарлаа");
    else {
      setSuccess(res.message || "Амжилттай хадгаллаа");
      await loadSummary();
      notifyRestaurantInfoUpdated();
    }
    setSaving(false);
  };

  const toggleUser = async (userId: string, isActive: boolean) => {
    await patchApi({ url: PATCH_PLATFORM_USER(userId), values: { isActive: !isActive } });
    await loadSummary();
  };

  const resetUserPassword = async () => {
    if (!userResetId || !userResetPassword) return;
    await postApi({
      url: POST_PLATFORM_USER_RESET_PASSWORD(userResetId),
      values: { password: userResetPassword },
    });
    setUserResetId(null);
    setUserResetPassword("");
    setSuccess("Нууц үг амжилттай шинэчлэгдлээ");
  };

  const markPaymentPaid = async (paymentId: string) => {
    await patchApi({
      url: PATCH_PLATFORM_PAYMENT(paymentId),
      values: { status: "paid", extendMonths: 1 },
    });
    await loadPayments();
    await loadSummary();
  };

  const createSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    await postApi({
      url: POST_PLATFORM_SUPPORT,
      values: { restaurantId: id, ...supportForm },
    });
    setSupportForm({ title: "", message: "" });
    await loadSupport();
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    await patchApi({ url: PATCH_PLATFORM_SUPPORT(ticketId), values: { status } });
    await loadSupport();
  };

  if (loading) {
    return <PlatformLoading />;
  }

  if (!summary || !restaurant) {
    return (
      <div className="space-y-4 py-8">
        <p className="text-sm text-red-600">{error || "Ресторан олдсонгүй"}</p>
        <Button variant="outline" onClick={() => router.push("/platform/restaurants")}>
          Буцах
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/platform/restaurants" className="text-sm text-blue-600 hover:underline">
        ← Ресторанууд руу буцах
      </Link>

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <RestaurantAvatar name={restaurant.name} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{restaurant.name}</h1>
                <PlanBadge plan={restaurant.plan} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                ID: {summary.displayId} · /{restaurant.slug}
              </p>
              <div className="mt-2">
                <RestaurantStatusBadges
                  restaurant={{
                    ...restaurant,
                    hasPendingPayment: summary.billing.hasPendingPayment,
                    daysRemaining: summary.subscription.daysRemaining,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setTab("settings")}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Засах
            </Button>
            <Button variant="outline" size="sm" disabled={saving} onClick={handleToggleActive}>
              {restaurant.isActive ? "Идэвхгүй болгох" : "Идэвхжүүлэх"}
            </Button>
            <Button variant="outline" size="sm" disabled={saving} onClick={handleExtend}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Хугацаа сунгах
            </Button>
            <Button
              size="sm"
              disabled={saving || !restaurant?.isActive}
              onClick={() => void handleEnterSystem()}
              title="Шинэ tab дээр систем нээнэ"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="mr-1.5 h-4 w-4" />
              + Систем рүү нэвтрэх
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Устгах
            </Button>
          </div>
        </div>
        {summary.warnings.length > 0 ? (
          <div className="mt-4 space-y-1 rounded-lg bg-amber-50 p-3">
            {summary.warnings.map((w) => (
              <p key={w} className="flex items-center gap-2 text-sm text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {success ? <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <PlatformTabs
          tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
          active={tab}
          onChange={(id) => setTab(id as TabId)}
        />
        <div className="p-6">

      {tab === "general" ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <InfoCard title="Үндсэн мэдээлэл">
              <InfoRow label="Рестораны нэр" value={restaurant.name} />
              <InfoRow label="Англи нэр" value={restaurant.englishName || "—"} />
              <InfoRow label="Эзэмшигч" value={restaurant.ownerName} />
              <InfoRow label="Имэйл" value={restaurant.email} />
              <InfoRow label="Утас 1" value={restaurant.phone} />
              <InfoRow label="Утас 2" value={restaurant.phone2 || "—"} />
              <InfoRow label="Хаяг" value={restaurant.address || "—"} />
              <InfoRow label="Үйл ажиллагааны төрөл" value={restaurant.businessType || "—"} />
              <InfoRow label="Танилцуулга" value={restaurant.description || "—"} />
              <InfoRow label="Дэлгэрэнгүй тайлбар" value={restaurant.detailDescription || "—"} />
              <InfoRow label="Веб сайт" value={restaurant.website || "—"} />
              <InfoRow label="Facebook" value={restaurant.facebook || "—"} />
              <InfoRow label="Instagram" value={restaurant.instagram || "—"} />
              <InfoRow label="Google map" value={restaurant.googleMapLink || "—"} />
              <InfoRow label="Бүртгэсэн" value={formatMnDate(restaurant.createdAt)} />
              <InfoRow label="Төлөв" value={restaurant.isActive ? "Идэвхтэй" : "Идэвхгүй"} />
            </InfoCard>
            <InfoCard title="Ашиглалтын мэдээлэл">
              <InfoRow label="Нийт хэрэглэгч" value={summary.usage.usersCount} />
              <InfoRow label="Ажилтан" value={summary.usage.staffCount} />
              <InfoRow label="Ширээ" value={summary.usage.tablesCount} />
              <InfoRow label="Цэсний бараа" value={summary.usage.menuItemsCount} />
              <InfoRow label="Нийт захиалга" value={summary.usage.ordersCount} />
              <InfoRow label="Өнөөдрийн захиалга" value={summary.usage.todayOrders} />
              <InfoRow label="Сарын захиалга" value={summary.usage.monthlyOrders} />
              <InfoRow label="Сүүлийн идэвх" value={formatMnDateTime(summary.usage.lastActivityDate)} />
            </InfoCard>
            <InfoCard title="Subscription">
              <InfoRow label="Багц" value={summary.subscription.plan} />
              <InfoRow label="Төлөв" value={subscriptionLabel(summary.subscription.subscriptionStatus)} />
              <InfoRow label="Эхлэх" value={formatMnDate(summary.subscription.startDate)} />
              <InfoRow label="Дуусах" value={formatMnDate(summary.subscription.expireDate)} />
              <InfoRow label="Үлдсэн хоног" value={`${summary.subscription.daysRemaining} хоног`} />
              <InfoRow label="maxTables" value={summary.subscription.maxTables} />
              <InfoRow label="maxUsers" value={summary.subscription.maxUsers} />
            </InfoCard>
            <InfoCard title="Сарын төлбөр">
              <InfoRow label="Сарын үнэ" value={`${summary.billing.monthlyPrice.toLocaleString()} ₮`} />
              <InfoRow label="Сүүлийн төлбөр" value={formatMnDate(summary.billing.lastPaymentDate)} />
              <InfoRow label="Дараагийн хугацаа" value={formatMnDate(summary.billing.nextDueDate)} />
              <InfoRow label="Төлбөрийн төлөв" value={subscriptionLabel(summary.billing.paymentStatus)} />
            </InfoCard>
          </div>
          <InfoCard title="Хурдан үйлдлүүд">
            <div className="grid gap-3 py-2 sm:grid-cols-2 lg:grid-cols-3">
              <PlatformQuickAction label="Хэрэглэгч нэмэх" icon={UserPlus} onClick={() => setTab("users")} />
              <PlatformQuickAction label="Эрх тохируулах" icon={Shield} onClick={() => router.push("/platform/roles")} />
              <PlatformQuickAction label="Төлбөрийн түүх" icon={CreditCard} onClick={() => setTab("payments")} />
              <div title="Шинэ tab дээр систем нээнэ">
                <PlatformQuickAction
                  label="Систем рүү нэвтрэх"
                  icon={ExternalLink}
                  onClick={() => void handleEnterSystem()}
                />
              </div>
              <PlatformQuickAction label="Support үүсгэх" icon={Headphones} onClick={() => setTab("support")} />
              <PlatformQuickAction label="Ресторан засах" icon={Settings} onClick={() => setTab("settings")} />
            </div>
            {summary.owner ? (
              <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
                <p className="w-full text-sm text-slate-600">
                  Owner: {summary.owner.username} ({summary.owner.email})
                </p>
                <Input
                  type="password"
                  placeholder="Шинэ нууц үг (owner)"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  className="max-w-xs"
                />
                <Button size="sm" disabled={saving} onClick={handleOwnerReset}>
                  <KeyRound className="mr-1.5 h-4 w-4" />
                  Owner password reset
                </Button>
              </div>
            ) : null}
          </InfoCard>
        </div>
      ) : null}

      {tab === "users" ? (
        <InfoCard title="Рестораны хэрэглэгчид">
          {summary.users.length === 0 ? (
            <EmptySection />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Нэр</th>
                    <th className="px-3 py-2 text-left">Username</th>
                    <th className="px-3 py-2 text-left">Эрх</th>
                    <th className="px-3 py-2 text-left">Төлөв</th>
                    <th className="px-3 py-2 text-left">Бүртгэсэн</th>
                    <th className="px-3 py-2 text-left">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.users.map((u) => (
                    <tr key={u._id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2">{u.username}</td>
                      <td className="px-3 py-2">{ROLE_LABELS_MN[u.role]}</td>
                      <td className="px-3 py-2">{u.isActive ? "Идэвхтэй" : "Идэвхгүй"}</td>
                      <td className="px-3 py-2">{formatMnDate(u.createdAt)}</td>
                      <td className="px-3 py-2 space-x-2">
                        <Button size="sm" variant="outline" onClick={() => void toggleUser(u._id, u.isActive)}>
                          {u.isActive ? "Идэвхгүй" : "Идэвхжүүлэх"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setUserResetId(u._id)}>
                          Нууц үг
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {userResetId ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              <Input type="password" value={userResetPassword} onChange={(e) => setUserResetPassword(e.target.value)} placeholder="Шинэ нууц үг" className="max-w-xs" />
              <Button size="sm" onClick={resetUserPassword}>Хадгалах</Button>
              <Button size="sm" variant="outline" onClick={() => setUserResetId(null)}>Болих</Button>
            </div>
          ) : null}
        </InfoCard>
      ) : null}

      {tab === "payments" ? (
        <div className="space-y-4">
          <InfoCard title="Одоогийн төлбөр">
            <InfoRow label="Багц" value={summary.billing.plan} />
            <InfoRow label="Сарын үнэ" value={`${summary.billing.monthlyPrice.toLocaleString()} ₮`} />
            <InfoRow label="Дараагийн хугацаа" value={formatMnDate(summary.billing.nextDueDate)} />
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleExtend}>Захиалга сунгах</Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await postApi({
                    url: POST_PLATFORM_PAYMENT,
                    values: { restaurantId: id, amount: summary.billing.monthlyPrice },
                  });
                  await loadPayments();
                }}
              >
                Төлбөр бүртгэх
              </Button>
            </div>
          </InfoCard>
          <InfoCard title="Төлбөрийн түүх">
            {payments.length === 0 ? (
              <EmptySection message="Төлбөрийн түүх байхгүй байна" />
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Дүн</th>
                    <th className="px-3 py-2 text-left">Төлөв</th>
                    <th className="px-3 py-2 text-left">Хугацаа</th>
                    <th className="px-3 py-2 text-left" />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{p.amount.toLocaleString()} ₮</td>
                      <td className="px-3 py-2">{subscriptionLabel(p.status)}</td>
                      <td className="px-3 py-2">{formatMnDate(p.dueDate)}</td>
                      <td className="px-3 py-2">
                        {p.status !== "paid" ? (
                          <Button size="sm" onClick={() => void markPaymentPaid(p._id)}>Төлсөн</Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </InfoCard>
        </div>
      ) : null}

      {tab === "system" ? (
        <InfoCard title="Систем мэдээлэл">
          <InfoRow label="restaurantId" value={summary.system.restaurantId} />
          <InfoRow label="slug" value={summary.system.slug} />
          <InfoRow label="createdAt" value={formatMnDateTime(summary.system.createdAt)} />
          <InfoRow label="updatedAt" value={formatMnDateTime(summary.system.updatedAt)} />
          <InfoRow label="maxTables / одоо" value={`${summary.system.maxTables} / ${summary.system.currentTables}`} />
          <InfoRow label="maxUsers / одоо" value={`${summary.system.maxUsers} / ${summary.system.currentUsers}`} />
          <InfoRow label="Цэс" value={summary.system.menuItems} />
          <InfoRow label="Захиалга" value={summary.system.orders} />
          <InfoRow label="Tenant scope" value={summary.system.tenantScope} />
        </InfoCard>
      ) : null}

      {tab === "support" ? (
        <div className="space-y-4">
          <InfoCard title="Support үүсгэх">
            <form onSubmit={createSupport} className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Гарчиг" value={supportForm.title} onChange={(e) => setSupportForm((f) => ({ ...f, title: e.target.value }))} required />
              <Input placeholder="Мессеж" value={supportForm.message} onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))} required className="md:col-span-2" />
              <Button type="submit" className="w-fit">Үүсгэх</Button>
            </form>
          </InfoCard>
          <InfoCard title="Support хүсэлтүүд">
            {tickets.length === 0 ? <EmptySection /> : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t._id} className="rounded-lg border border-slate-100 p-4">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-medium">{t.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{t.message}</p>
                        <p className="mt-2 text-xs text-slate-400">
                          {t.type} · {t.priority} · {formatMnDate(t.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="outline" onClick={() => void updateTicketStatus(t._id, "resolved")}>
                          Шийдсэн
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </InfoCard>
        </div>
      ) : null}

      {tab === "settings" ? (
        <InfoCard title="Рестораны тохиргоо">
          <form onSubmit={handleSaveSettings} className="grid max-w-2xl gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Рестораны нэр</label>
              <Input value={settingsForm.name} onChange={(e) => setSettingsForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Эзэмшигч</label>
              <Input value={settingsForm.ownerName} onChange={(e) => setSettingsForm((f) => ({ ...f, ownerName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Имэйл</label>
              <Input type="email" value={settingsForm.email} onChange={(e) => setSettingsForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Утас 1</label>
              <Input value={settingsForm.phone} onChange={(e) => setSettingsForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Утас 2</label>
              <Input value={settingsForm.phone2} onChange={(e) => setSettingsForm((f) => ({ ...f, phone2: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Англи нэр</label>
              <Input value={settingsForm.englishName} onChange={(e) => setSettingsForm((f) => ({ ...f, englishName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Лого (URL)</label>
              <Input value={settingsForm.logoUrl} onChange={(e) => setSettingsForm((f) => ({ ...f, logoUrl: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Үйл ажиллагааны төрөл</label>
              <Input value={settingsForm.businessType} onChange={(e) => setSettingsForm((f) => ({ ...f, businessType: e.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Танилцуулга</label>
              <Input value={settingsForm.description} onChange={(e) => setSettingsForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Дэлгэрэнгүй тайлбар</label>
              <textarea
                value={settingsForm.detailDescription}
                onChange={(e) => setSettingsForm((f) => ({ ...f, detailDescription: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Веб сайт</label>
              <Input value={settingsForm.website} onChange={(e) => setSettingsForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Facebook</label>
              <Input value={settingsForm.facebook} onChange={(e) => setSettingsForm((f) => ({ ...f, facebook: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Instagram</label>
              <Input value={settingsForm.instagram} onChange={(e) => setSettingsForm((f) => ({ ...f, instagram: e.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Хаяг</label>
              <Input value={settingsForm.address} onChange={(e) => setSettingsForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Google map link</label>
              <Input value={settingsForm.googleMapLink} onChange={(e) => setSettingsForm((f) => ({ ...f, googleMapLink: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Багц</label>
              <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={settingsForm.plan} onChange={(e) => setSettingsForm((f) => ({ ...f, plan: e.target.value as RestaurantPlan }))}>
                <option value="starter">Starter</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Захиалгын төлөв</label>
              <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={settingsForm.subscriptionStatus} onChange={(e) => setSettingsForm((f) => ({ ...f, subscriptionStatus: e.target.value as SubscriptionStatus }))}>
                <option value="active">Идэвхтэй</option>
                <option value="expired">Хугацаа дууссан</option>
                <option value="suspended">Түдгэлзсэн</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ширээний дээд тоо</label>
              <Input type="number" min="1" value={settingsForm.maxTables} onChange={(e) => setSettingsForm((f) => ({ ...f, maxTables: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Хэрэглэгчийн дээд тоо</label>
              <Input type="number" min="1" value={settingsForm.maxUsers} onChange={(e) => setSettingsForm((f) => ({ ...f, maxUsers: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Дуусах огноо</label>
              <Input type="date" value={settingsForm.expireDate} onChange={(e) => setSettingsForm((f) => ({ ...f, expireDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5 flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settingsForm.isActive} onChange={(e) => setSettingsForm((f) => ({ ...f, isActive: e.target.checked }))} />
                Идэвхтэй ресторан
              </label>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </div>
          </form>
        </InfoCard>
      ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Ресторан устгах уу?"
        description={
          <span>
            <span className="font-semibold text-slate-900">{restaurant.name}</span>{" "}
            ресторан болон түүний бүх хэрэглэгч, цэс, захиалга, ширээ зэрэг
            холбогдох өгөгдөл бүрмөсөн устах болно. Энэ үйлдлийг буцаах
            боломжгүй.
          </span>
        }
        confirmText={restaurant.name}
        confirmLabel="Бүрмөсөн устгах"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

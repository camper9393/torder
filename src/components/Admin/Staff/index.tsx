"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS_MN, UserRole } from "@/constants/userRoles";
import type { PublicUser } from "@/service/userAuth";
import type { Restaurant } from "@/types/restaurant";
import {
  GET_ADMIN_STAFF,
  GET_PLATFORM_RESTAURANTS,
  PATCH_ADMIN_STAFF,
  POST_ADMIN_STAFF,
  POST_ADMIN_STAFF_RESET_PASSWORD,
} from "@/utils/APIConstant";
import { getApi, patchApi, postApi } from "@/utils/common";
import React from "react";

type StaffListResponse = {
  success: boolean;
  message: string;
  data?: {
    staff: PublicUser[];
    restaurantId: string;
    assignableRoles: UserRole[];
  };
};

type Props = {
  currentUser: PublicUser;
};

const EMPTY_FORM = {
  name: "",
  email: "",
  username: "",
  password: "",
  role: UserRole.WAITER as UserRole,
};

export default function AdminStaffPage({ currentUser }: Props) {
  const isPlatformOwner = currentUser.role === UserRole.PLATFORM_OWNER;
  const [staff, setStaff] = React.useState<PublicUser[]>([]);
  const [assignableRoles, setAssignableRoles] = React.useState<UserRole[]>([]);
  const [restaurantId, setRestaurantId] = React.useState<string>(
    currentUser.restaurantId ? String(currentUser.restaurantId) : ""
  );
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [resetTarget, setResetTarget] = React.useState<PublicUser | null>(null);
  const [resetPassword, setResetPassword] = React.useState("");
  const [resetting, setResetting] = React.useState(false);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const loadRestaurants = React.useCallback(async () => {
    if (!isPlatformOwner) return;
    const res = await getApi<{
      success: boolean;
      data?: Restaurant[];
    }>({ url: GET_PLATFORM_RESTAURANTS });
    if (res?.success && res.data?.length) {
      setRestaurants(res.data);
      setRestaurantId((prev) => prev || String(res.data![0]._id));
    }
  }, [isPlatformOwner]);

  const loadStaff = React.useCallback(
    async (scopeRestaurantId?: string) => {
      setLoading(true);
      setError("");
      const rid = scopeRestaurantId ?? restaurantId;
      const param = isPlatformOwner && rid ? { restaurantId: rid } : undefined;
      const res = await getApi<StaffListResponse>({
        url: GET_ADMIN_STAFF,
        ...(param ? { param } : {}),
      });
      if (res?.success && res.data) {
        setStaff(res.data.staff);
        setAssignableRoles(res.data.assignableRoles);
      } else {
        setError(res?.message || "Жагсаалт ачаалахад алдаа гарлаа");
      }
      setLoading(false);
    },
    [isPlatformOwner, restaurantId]
  );

  React.useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  React.useEffect(() => {
    if (isPlatformOwner && !restaurantId) return;
    void loadStaff(restaurantId);
  }, [isPlatformOwner, restaurantId, loadStaff]);

  React.useEffect(() => {
    if (assignableRoles.length > 0 && !assignableRoles.includes(form.role)) {
      setForm((f) => ({ ...f, role: assignableRoles[0] }));
    }
  }, [assignableRoles, form.role]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    const res = await postApi<{ success: boolean; message: string }>({
      url: POST_ADMIN_STAFF,
      values: {
        ...form,
        ...(isPlatformOwner && restaurantId ? { restaurantId } : {}),
      },
    });

    if (!res?.success) {
      setError(res?.message || "Ажилтан нэмэхэд алдаа гарлаа");
      setCreating(false);
      return;
    }

    setForm({ ...EMPTY_FORM, role: assignableRoles[0] ?? UserRole.WAITER });
    await loadStaff();
    setCreating(false);
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setSavingId(userId);
    const res = await patchApi<{ success: boolean; message: string }>({
      url: PATCH_ADMIN_STAFF(userId),
      values: { role },
    });
    if (!res?.success) {
      setError(res?.message || "Үүрэг шинэчлэхэд алдаа гарлаа");
    } else {
      await loadStaff();
    }
    setSavingId(null);
  };

  const handleToggleActive = async (member: PublicUser) => {
    setSavingId(String(member._id));
    const res = await patchApi<{ success: boolean; message: string }>({
      url: PATCH_ADMIN_STAFF(String(member._id)),
      values: { isActive: !member.isActive },
    });
    if (!res?.success) {
      setError(res?.message || "Төлөв шинэчлэхэд алдаа гарлаа");
    } else {
      await loadStaff();
    }
    setSavingId(null);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    setError("");

    const res = await postApi<{ success: boolean; message: string }>({
      url: POST_ADMIN_STAFF_RESET_PASSWORD(String(resetTarget._id)),
      values: { password: resetPassword },
    });

    if (!res?.success) {
      setError(res?.message || "Нууц үг солиход алдаа гарлаа");
      setResetting(false);
      return;
    }

    setResetTarget(null);
    setResetPassword("");
    setResetting(false);
  };

  const canEditMember = (member: PublicUser): boolean => {
    if (String(member._id) === String(currentUser._id)) return false;
    if (
      currentUser.role === UserRole.MANAGER &&
      member.role === UserRole.RESTAURANT_OWNER
    ) {
      return false;
    }
    return true;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Ажилтан</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Рестораны ажилтнуудын бүртгэл, үүрэг, нэвтрэх эрх
        </p>
      </div>

      {isPlatformOwner && restaurants.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Ресторан сонгох
          </label>
          <Select
            value={restaurantId}
            onValueChange={(v) => setRestaurantId(v)}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Ресторан" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((r) => (
                <SelectItem key={r._id} value={String(r._id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-medium text-zinc-900">Шинэ ажилтан нэмэх</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Нэр *</label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
            <label className="text-sm font-medium text-zinc-700">
              Хэрэглэгчийн нэр *
            </label>
            <Input
              required
              value={form.username}
              onChange={(e) =>
                setForm((f) => ({ ...f, username: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              Түр нууц үг *
            </label>
            <Input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) =>
                setForm((f) => ({ ...f, password: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">Үүрэг *</label>
            <Select
              value={form.role}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, role: v as UserRole }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS_MN[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={creating}>
          {creating ? "Нэмж байна..." : "Ажилтан нэмэх"}
        </Button>
      </form>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h2 className="text-lg font-medium text-zinc-900">Ажилтнууд</h2>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-zinc-500">Ачааллаж байна...</p>
        ) : staff.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">Одоогоор ажилтан бүртгэгдээгүй.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Нэр</th>
                  <th className="px-4 py-3 font-medium">Хэрэглэгчийн нэр</th>
                  <th className="px-4 py-3 font-medium">Имэйл</th>
                  <th className="px-4 py-3 font-medium">Үүрэг</th>
                  <th className="px-4 py-3 font-medium">Төлөв</th>
                  <th className="px-4 py-3 font-medium">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const editable = canEditMember(member);
                  const id = String(member._id);
                  return (
                    <tr key={id} className="border-t border-zinc-100">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {member.name}
                      </td>
                      <td className="px-4 py-3">{member.username}</td>
                      <td className="px-4 py-3">{member.email}</td>
                      <td className="px-4 py-3">
                        {editable && assignableRoles.includes(member.role) ? (
                          <Select
                            value={member.role}
                            disabled={savingId === id}
                            onValueChange={(v) =>
                              void handleRoleChange(id, v as UserRole)
                            }
                          >
                            <SelectTrigger className="h-8 w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {assignableRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_LABELS_MN[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          ROLE_LABELS_MN[member.role]
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            member.isActive
                              ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800"
                              : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
                          }
                        >
                          {member.isActive ? "Идэвхтэй" : "Идэвхгүй"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {editable ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={savingId === id}
                                onClick={() => void handleToggleActive(member)}
                              >
                                {member.isActive ? "Идэвхгүй" : "Идэвхжүүлэх"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setResetTarget(member);
                                  setResetPassword("");
                                }}
                              >
                                Нууц үг солих
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {resetTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleResetPassword}
            className="w-full max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-lg"
          >
            <h3 className="text-lg font-medium text-zinc-900">
              Нууц үг солих — {resetTarget.name}
            </h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">
                Шинэ түр нууц үг
              </label>
              <Input
                required
                type="password"
                minLength={6}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={resetting}>
                {resetting ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetTarget(null)}
              >
                Болих
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

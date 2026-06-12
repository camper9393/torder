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
import {
  PlatformCard,
  PlatformEmpty,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
} from "@/components/Platform/shared";
import {
  GET_PLATFORM_USERS,
  PATCH_PLATFORM_USER,
  POST_PLATFORM_USER_RESET_PASSWORD,
} from "@/utils/APIConstant";
import { getApi, patchApi, postApi } from "@/utils/common";
import React from "react";

type PlatformUser = {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  restaurantName?: string;
  isActive: boolean;
  createdAt: string;
};

export default function PlatformUsersPage() {
  const [users, setUsers] = React.useState<PlatformUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [resetId, setResetId] = React.useState<string | null>(null);
  const [resetPassword, setResetPassword] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await getApi<{ success: boolean; data?: PlatformUser[]; message?: string }>({
      url: GET_PLATFORM_USERS,
      param: {
        ...(roleFilter !== "all" ? { role: roleFilter } : {}),
        ...(search ? { search } : {}),
      },
    });
    if (!res?.success || !res.data) {
      setError(res?.message || "Алдаа гарлаа");
    } else {
      setUsers(res.data);
    }
    setLoading(false);
  }, [roleFilter, search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (user: PlatformUser) => {
    const res = await patchApi<{ success: boolean; message?: string }>({
      url: PATCH_PLATFORM_USER(user._id),
      values: { isActive: !user.isActive },
    });
    if (!res?.success) {
      setError(res?.message || "Алдаа гарлаа");
      return;
    }
    await load();
  };

  const handleReset = async () => {
    if (!resetId || !resetPassword) return;
    const res = await postApi<{ success: boolean; message?: string }>({
      url: POST_PLATFORM_USER_RESET_PASSWORD(resetId),
      values: { password: resetPassword },
    });
    if (!res?.success) {
      setError(res?.message || "Алдаа гарлаа");
      return;
    }
    setResetId(null);
    setResetPassword("");
    alert(res.message || "Амжилттай хадгаллаа");
  };

  return (
    <div className="space-y-6">
      <PlatformPageHeader title="Хэрэглэгчид" description="Бүх рестораны хэрэглэгчид" />
      <PlatformCard className="flex flex-wrap gap-3">
        <Input
          placeholder="Хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Эрх" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх эрх</SelectItem>
            {Object.values(UserRole)
              .filter((r) => r !== UserRole.PLATFORM_OWNER)
              .map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS_MN[r]}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => void load()}>
          Шүүх
        </Button>
      </PlatformCard>

      {loading ? <PlatformLoading /> : null}
      {error ? <PlatformError message={error} /> : null}

      {!loading && users.length === 0 ? <PlatformEmpty /> : null}

      {!loading && users.length > 0 ? (
        <PlatformCard className="overflow-x-auto p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Нэр</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Эрх</th>
                <th className="px-4 py-3 text-left">Ресторан</th>
                <th className="px-4 py-3 text-left">Төлөв</th>
                <th className="px-4 py-3 text-left">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">{ROLE_LABELS_MN[u.role]}</td>
                  <td className="px-4 py-3">{u.restaurantName ?? "—"}</td>
                  <td className="px-4 py-3">{u.isActive ? "Идэвхтэй" : "Идэвхгүй"}</td>
                  <td className="px-4 py-3 space-x-2">
                    <Button size="sm" variant="outline" onClick={() => void toggleActive(u)}>
                      {u.isActive ? "Идэвхгүй" : "Идэвхжүүлэх"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setResetId(u._id)}>
                      Нууц үг
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PlatformCard>
      ) : null}

      {resetId ? (
        <PlatformCard>
          <h3 className="font-semibold">Нууц үг солих</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Шинэ нууц үг"
              className="max-w-xs"
            />
            <Button onClick={() => void handleReset()}>Хадгалах</Button>
            <Button variant="outline" onClick={() => setResetId(null)}>
              Болих
            </Button>
          </div>
        </PlatformCard>
      ) : null}
    </div>
  );
}

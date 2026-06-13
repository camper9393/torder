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
  ConfirmDialog,
  PlatformCard,
  PlatformEmpty,
  PlatformError,
  PlatformLoading,
  PlatformPageHeader,
} from "@/components/Platform/shared";
import {
  DELETE_PLATFORM_USER,
  GET_PLATFORM_RESTAURANTS,
  GET_PLATFORM_USERS,
  PATCH_PLATFORM_USER,
  POST_PLATFORM_USER,
  POST_PLATFORM_USER_RESET_PASSWORD,
} from "@/utils/APIConstant";
import { deleteApi, getApi, patchApi, postApi } from "@/utils/common";
import toast from "react-hot-toast";
import React from "react";

type PlatformUser = {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  restaurantId?: string;
  restaurantName?: string;
  isActive: boolean;
  createdAt: string;
};

type RestaurantOption = { _id: string; name: string };

// Platform owner оноож болох эрхүүд (өөрийгөө оруулахгүй)
const ASSIGNABLE_ROLES = Object.values(UserRole).filter(
  (r) => r !== UserRole.PLATFORM_OWNER
);

const EMPTY_CREATE = {
  name: "",
  email: "",
  username: "",
  password: "",
  role: UserRole.WAITER as UserRole,
  restaurantId: "",
};

export default function PlatformUsersPage() {
  const [users, setUsers] = React.useState<PlatformUser[]>([]);
  const [restaurants, setRestaurants] = React.useState<RestaurantOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [createForm, setCreateForm] = React.useState(EMPTY_CREATE);

  const [resetId, setResetId] = React.useState<string | null>(null);
  const [resetPassword, setResetPassword] = React.useState("");

  const [deleteUser, setDeleteUser] = React.useState<PlatformUser | null>(null);
  const [deleting, setDeleting] = React.useState(false);

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

  const loadRestaurants = React.useCallback(async () => {
    const res = await getApi<{ success: boolean; data?: RestaurantOption[] }>({
      url: GET_PLATFORM_RESTAURANTS,
    });
    if (res?.success && res.data) {
      setRestaurants(res.data.map((r) => ({ _id: r._id, name: r.name })));
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.restaurantId) {
      toast.error("Ресторан сонгоно уу");
      return;
    }
    setCreating(true);
    const res = await postApi<{ success: boolean; message?: string }>({
      url: POST_PLATFORM_USER,
      values: createForm,
    });
    setCreating(false);
    if (!res?.success) {
      toast.error(res?.message || "Хэрэглэгч үүсгэхэд алдаа гарлаа");
      return;
    }
    toast.success(res.message || "Хэрэглэгч үүслээ");
    setCreateForm(EMPTY_CREATE);
    setShowCreate(false);
    await load();
  };

  const toggleActive = async (user: PlatformUser) => {
    const res = await patchApi<{ success: boolean; message?: string }>({
      url: PATCH_PLATFORM_USER(user._id),
      values: { isActive: !user.isActive },
    });
    if (!res?.success) {
      toast.error(res?.message || "Алдаа гарлаа");
      return;
    }
    toast.success(user.isActive ? "Идэвхгүй болголоо" : "Идэвхжүүллээ");
    await load();
  };

  const changeRole = async (user: PlatformUser, role: UserRole) => {
    if (role === user.role) return;
    const res = await patchApi<{ success: boolean; message?: string }>({
      url: PATCH_PLATFORM_USER(user._id),
      values: { role },
    });
    if (!res?.success) {
      toast.error(res?.message || "Эрх өөрчлөхөд алдаа гарлаа");
      return;
    }
    toast.success("Эрх шинэчлэгдлээ");
    await load();
  };

  const handleReset = async () => {
    if (!resetId || !resetPassword) return;
    const res = await postApi<{ success: boolean; message?: string }>({
      url: POST_PLATFORM_USER_RESET_PASSWORD(resetId),
      values: { password: resetPassword },
    });
    if (!res?.success) {
      toast.error(res?.message || "Алдаа гарлаа");
      return;
    }
    setResetId(null);
    setResetPassword("");
    toast.success(res.message || "Нууц үг шинэчлэгдлээ");
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    const res = await deleteApi<{ success: boolean; message?: string }>({
      url: DELETE_PLATFORM_USER(deleteUser._id),
    });
    setDeleting(false);
    if (!res?.success) {
      toast.error(res?.message || "Устгахад алдаа гарлаа");
      return;
    }
    toast.success(res.message || "Хэрэглэгч устгагдлаа");
    setDeleteUser(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Хэрэглэгчид"
        description="Бүх рестораны хэрэглэгчид"
        action={
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Хаах" : "+ Шинэ хэрэглэгч"}
          </Button>
        }
      />

      {showCreate ? (
        <PlatformCard title="Шинэ хэрэглэгч үүсгэх">
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Нэр *</label>
              <Input
                required
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Имэйл *</label>
              <Input
                required
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Username *</label>
              <Input
                required
                value={createForm.username}
                onChange={(e) => setCreateForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Нууц үг *</label>
              <Input
                required
                type="password"
                minLength={6}
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Ресторан *</label>
              <Select
                value={createForm.restaurantId}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, restaurantId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ресторан сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Эрх *</label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, role: v as UserRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS_MN[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={creating}>
                {creating ? "Үүсгэж байна..." : "Хэрэглэгч үүсгэх"}
              </Button>
            </div>
          </form>
        </PlatformCard>
      ) : null}

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
            {ASSIGNABLE_ROLES.map((r) => (
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
                  <td className="px-4 py-3">
                    <Select
                      value={u.role}
                      onValueChange={(v) => void changeRole(u, v as UserRole)}
                    >
                      <SelectTrigger className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS_MN[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">{u.restaurantName ?? "—"}</td>
                  <td className="px-4 py-3">{u.isActive ? "Идэвхтэй" : "Идэвхгүй"}</td>
                  <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => void toggleActive(u)}>
                      {u.isActive ? "Идэвхгүй" : "Идэвхжүүлэх"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setResetId(u._id)}>
                      Нууц үг
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setDeleteUser(u)}
                    >
                      Устгах
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

      <ConfirmDialog
        open={!!deleteUser}
        title="Хэрэглэгч устгах уу?"
        description={
          deleteUser ? (
            <span>
              <span className="font-semibold text-slate-900">{deleteUser.name}</span>{" "}
              ({deleteUser.username}) хэрэглэгчийг бүрмөсөн устгах гэж байна. Энэ
              үйлдлийг буцаах боломжгүй.
            </span>
          ) : null
        }
        confirmLabel="Устгах"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteUser(null)}
      />
    </div>
  );
}

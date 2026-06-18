"use client";

import React from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";

import SettingsSectionCard from "@/components/Admin/Settings/SettingsSectionCard";
import { useSettingsApiParams } from "@/components/Admin/Settings/useSettingsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DELETE_ADMIN_SETTINGS_BRANCH,
  GET_ADMIN_SETTINGS_BRANCHES,
  PATCH_ADMIN_SETTINGS_BRANCH,
  POST_ADMIN_SETTINGS_BRANCH,
} from "@/utils/APIConstant";
import { deleteApi, getApi, patchApi, postApi } from "@/utils/common";
import { cn } from "@/lib/utils";

type BranchRow = {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  description: string;
  status: string;
};

const EMPTY_FORM = {
  name: "",
  address: "",
  phone: "",
  email: "",
  manager: "",
  description: "",
};

export default function BranchesSection() {
  const settingsApiParam = useSettingsApiParams();
  const [items, setItems] = React.useState<BranchRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BranchRow | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getApi<{ success: boolean; data?: BranchRow[] }>({
      url: GET_ADMIN_SETTINGS_BRANCHES,
      param: settingsApiParam,
    });
    if (res?.success && res.data) setItems(res.data);
    setLoading(false);
  }, [settingsApiParam]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row: BranchRow) => {
    setEditing(row);
    setForm({
      name: row.name,
      address: row.address,
      phone: row.phone,
      email: row.email,
      manager: row.manager,
      description: row.description,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Салбарын нэр оруулна уу");
      return;
    }
    setSaving(true);
    const res = editing
      ? await patchApi<{ success: boolean; message?: string }>({
          url: PATCH_ADMIN_SETTINGS_BRANCH(editing._id),
          values: form,
          param: settingsApiParam,
        })
      : await postApi<{ success: boolean; message?: string }>({
          url: POST_ADMIN_SETTINGS_BRANCH,
          values: form,
          param: settingsApiParam,
        });
    setSaving(false);
    if (!res?.success) {
      toast.error(res?.message || "Алдаа гарлаа");
      return;
    }
    toast.success(editing ? "Засагдлаа" : "Нэмэгдлээ");
    setModalOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Энэ салбарыг устгах уу?")) return;
    const res = await deleteApi<{ success: boolean; message?: string }>({
      url: DELETE_ADMIN_SETTINGS_BRANCH(id),
      param: settingsApiParam,
    });
    if (!res?.success) {
      toast.error(res?.message || "Устгахад алдаа");
      return;
    }
    toast.success("Устгагдлаа");
    await load();
  };

  return (
    <>
      <SettingsSectionCard
        title="Салбарын мэдээлэл"
        description="Олон салбартай болох бүтэцэд бэлэн."
      >
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={openCreate} className="gap-2 min-h-10">
            <Plus className="h-4 w-4" />
            Салбар нэмэх
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Ачааллаж байна...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">Салбар бүртгэгдээгүй байна.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Салбарын нэр</th>
                  <th className="px-4 py-3">Хаяг</th>
                  <th className="px-4 py-3">Утас</th>
                  <th className="px-4 py-3">Менежер</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3 text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row) => (
                  <tr key={row._id}>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600">{row.address || "—"}</td>
                    <td className="px-4 py-3">{row.phone || "—"}</td>
                    <td className="px-4 py-3">{row.manager || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          row.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {row.status === "active" ? "Идэвхтэй" : "Идэвхгүй"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => void remove(row._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsSectionCard>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              {editing ? "Салбар засах" : "Салбар нэмэх"}
            </h3>
            <div className="mt-4 grid gap-3">
              <Input
                placeholder="Салбарын нэр *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                placeholder="Хаяг"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
              <Input
                placeholder="Утас"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                placeholder="Имэйл"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                placeholder="Менежер"
                value={form.manager}
                onChange={(e) => setForm((f) => ({ ...f, manager: e.target.value }))}
              />
              <textarea
                placeholder="Тайлбар"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Цуцлах
              </Button>
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

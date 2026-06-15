"use client";

import { USER_PASSCODE } from "@/utils/APIConstant";
import { deleteApi, getApi, postApi } from "@/utils/common";
import { KeyRound } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";

type StatusResponse = {
  success: boolean;
  data?: { enabled: boolean };
};

type ActionResponse = { success: boolean; message?: string };

function PinInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="password"
      inputMode="numeric"
      autoComplete="off"
      maxLength={4}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-4 text-sm tracking-[0.4em] outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
    />
  );
}

export default function PasscodeManager() {
  const [enabled, setEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [currentPasscode, setCurrentPasscode] = React.useState("");
  const [newPasscode, setNewPasscode] = React.useState("");
  const [confirmPasscode, setConfirmPasscode] = React.useState("");

  const loadStatus = React.useCallback(async () => {
    setLoading(true);
    const res = await getApi<StatusResponse>({ url: USER_PASSCODE });
    setEnabled(Boolean(res?.data?.enabled));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const resetFields = () => {
    setCurrentPassword("");
    setCurrentPasscode("");
    setNewPasscode("");
    setConfirmPasscode("");
  };

  const handleSave = async () => {
    if (!/^\d{4}$/.test(newPasscode)) {
      toast.error("4 оронтой пин код оруулна уу");
      return;
    }
    if (newPasscode !== confirmPasscode) {
      toast.error("Пин код таарахгүй байна");
      return;
    }
    if (!currentPassword && !(enabled && currentPasscode)) {
      toast.error("Одоогийн нууц үг эсвэл пин кодоо оруулна уу");
      return;
    }

    setSaving(true);
    const res = await postApi<ActionResponse>({
      url: USER_PASSCODE,
      values: {
        newPasscode,
        ...(currentPassword ? { currentPassword } : {}),
        ...(currentPasscode ? { currentPasscode } : {}),
      },
    });
    setSaving(false);

    if (!res?.success) {
      toast.error(res?.message || "Алдаа гарлаа");
      return;
    }
    toast.success("Пин код амжилттай хадгалагдлаа");
    resetFields();
    await loadStatus();
  };

  const handleRemove = async () => {
    if (!currentPassword && !currentPasscode) {
      toast.error("Одоогийн нууц үг эсвэл пин кодоо оруулна уу");
      return;
    }
    setSaving(true);
    const res = await deleteApi<ActionResponse>({
      url: USER_PASSCODE,
      values: {
        ...(currentPassword ? { currentPassword } : {}),
        ...(currentPasscode ? { currentPasscode } : {}),
      },
    });
    setSaving(false);

    if (!res?.success) {
      toast.error(res?.message || "Алдаа гарлаа");
      return;
    }
    toast.success("Пин код устгагдлаа");
    resetFields();
    await loadStatus();
  };

  if (loading) {
    return (
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">Ачааллаж байна...</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
          <KeyRound className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-gray-900">
            {enabled ? "Пин код солих" : "Пин код тохируулах"}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {enabled
              ? "Хадгалсан профайлаараа хурдан нэвтрэх 4 оронтой пин код. Солих эсвэл устгахын тулд одоогийн нууц үг эсвэл пин кодоо баталгаажуулна уу."
              : "Нэвтрэх хуудсанд профайлаа дараад 4 оронтой пин кодоор хурдан нэвтэрнэ. Тохируулахын тулд одоогийн нууц үгээ баталгаажуулна уу."}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">
                Одоогийн нууц үг
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            {enabled ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  эсвэл одоогийн пин код
                </label>
                <PinInput
                  value={currentPasscode}
                  onChange={setCurrentPasscode}
                  placeholder="••••"
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">
                Шинэ пин код (4 орон)
              </label>
              <PinInput
                value={newPasscode}
                onChange={setNewPasscode}
                placeholder="••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">
                Шинэ пин код давтах
              </label>
              <PinInput
                value={confirmPasscode}
                onChange={setConfirmPasscode}
                placeholder="••••"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="h-10 rounded-lg bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-60"
            >
              {saving ? "Хадгалж байна..." : enabled ? "Пин код солих" : "Пин код тохируулах"}
            </button>
            {enabled ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleRemove()}
                className="h-10 rounded-lg border border-red-200 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                Пин код устгах
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

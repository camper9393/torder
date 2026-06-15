"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuthLoginUser } from "@/utils/authSession";
import { USER_PASSCODE_SETUP } from "@/utils/APIConstant";
import { postApi } from "@/utils/common";
import React from "react";

type PinSetupOfferModalProps = {
  open: boolean;
  user: AuthLoginUser;
  onLater: () => void;
  onSuccess: () => void;
};

function PinField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
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
    </div>
  );
}

export default function PinSetupOfferModal({
  open,
  user,
  onLater,
  onSuccess,
}: PinSetupOfferModalProps) {
  const [step, setStep] = React.useState<"offer" | "create">("offer");
  const [pin, setPin] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setStep("offer");
    setPin("");
    setConfirmPin("");
    setError("");
    setSaving(false);
  }, [open, user._id]);

  const handleCreate = async () => {
    setError("");

    if (!/^\d{4}$/.test(pin)) {
      setError("4 оронтой пин код оруулна уу");
      return;
    }

    if (pin !== confirmPin) {
      setError("PIN код таарахгүй байна");
      return;
    }

    setSaving(true);
    try {
      const res = await postApi<{ success: boolean; message?: string }>({
        url: USER_PASSCODE_SETUP,
        values: { newPasscode: pin },
      });

      if (!res?.success) {
        setError(res?.message || "Пин код хадгалахад алдаа гарлаа");
        return;
      }

      onSuccess();
    } catch {
      setError("Пин код хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !saving) {
          onLater();
        }
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        {step === "offer" ? (
          <>
            <DialogHeader>
              <DialogTitle>PIN код үүсгэх үү?</DialogTitle>
              <DialogDescription>
                Та PIN код үүсгэвэл дараагийн удаа хурдан, хялбар нэвтрэх боломжтой
                болно.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onLater}>
                Дараа
              </Button>
              <Button type="button" onClick={() => setStep("create")}>
                PIN үүсгэх
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>PIN код үүсгэх</DialogTitle>
              <DialogDescription>
                {user.name ? `${user.name} — ` : ""}4 оронтой пин код оруулаад
                давтан баталгаажуулна уу.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <PinField
                label="Шинэ PIN код"
                placeholder="••••"
                value={pin}
                onChange={setPin}
              />
              <PinField
                label="PIN код давтах"
                placeholder="••••"
                value={confirmPin}
                onChange={setConfirmPin}
              />
              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => {
                  setError("");
                  setStep("offer");
                }}
              >
                Буцах
              </Button>
              <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

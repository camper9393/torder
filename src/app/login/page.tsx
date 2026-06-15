"use client";

import PasscodeKeypad from "@/components/Auth/PasscodeKeypad";
import PinSetupOfferModal from "@/components/Auth/PinSetupOfferModal";
import { USER_LOGIN, USER_PASSCODE_LOGIN } from "@/utils/APIConstant";
import { completeLoginAfterSuccess, type AuthLoginUser } from "@/utils/authSession";
import { postApi } from "@/utils/common";
import {
  getLockRemaining,
  getSavedUsers,
  isUserSavedLocally,
  recordFailedAttempt,
  removeSavedUser,
  type SavedUser,
} from "@/utils/savedUsers";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { X } from "lucide-react";

type LoginResponse = {
  success: boolean;
  message?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    permissions?: string[];
    restaurantId?: string;
    isActive?: boolean;
    passcodeEnabled?: boolean;
  };
};

function shouldOfferPinSetup(user: AuthLoginUser | undefined): user is AuthLoginUser {
  if (!user?._id) return false;
  if (user.passcodeEnabled) return false;
  return !isUserSavedLocally(String(user._id));
}

function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin/users";

  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);
  const [selected, setSelected] = useState<SavedUser | null>(null);

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // passcode mode
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [pendingLoginUser, setPendingLoginUser] = useState<AuthLoginUser | null>(null);

  React.useEffect(() => {
    setSavedUsers(getSavedUsers());
  }, []);

  // Түгжээний countdown
  React.useEffect(() => {
    if (!selected) return;
    const tick = () => {
      const remaining = getLockRemaining(selected.userId);
      setLockRemaining(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [selected]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await postApi<LoginResponse>({
        url: USER_LOGIN,
        values: { login, password },
      });
      if (!res?.success) {
        setError(res?.message || "Нэвтрэхэд алдаа гарлаа");
        return;
      }

      if (shouldOfferPinSetup(res.user)) {
        setPendingLoginUser(res.user);
        setPinSetupOpen(true);
        return;
      }

      await completeLoginAfterSuccess(res.user, nextPath);
    } catch {
      setError("Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  const openPasscode = (user: SavedUser) => {
    setSelected(user);
    setPinError("");
    setResetSignal((s) => s + 1);
  };

  const cancelPasscode = () => {
    setSelected(null);
    setPinError("");
  };

  const handleRemoveSavedUser = (
    event: React.MouseEvent<HTMLButtonElement>,
    userId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    removeSavedUser(userId);
    setSavedUsers(getSavedUsers());
    if (selected?.userId === userId) {
      setSelected(null);
      setPinError("");
    }
  };

  const handlePasscode = async (code: string) => {
    if (!selected) return;
    if (getLockRemaining(selected.userId) > 0) return;

    setPinLoading(true);
    setPinError("");
    try {
      const res = await postApi<LoginResponse>({
        url: USER_PASSCODE_LOGIN,
        values: { userId: selected.userId, passcode: code },
      });

      if (res?.success) {
        await completeLoginAfterSuccess(res.user, nextPath);
        return;
      }

      // Хэрэглэгч олдсонгүй → saved-аас устгана
      if (res?.message === "Хэрэглэгч олдсонгүй") {
        removeSavedUser(selected.userId);
        setSavedUsers(getSavedUsers());
        setSelected(null);
        setError("Энэ хэрэглэгч олдсонгүй. Дахин нэвтэрнэ үү.");
        return;
      }

      const lock = recordFailedAttempt(selected.userId);
      setResetSignal((s) => s + 1);
      if (lock.locked) {
        setLockRemaining(getLockRemaining(selected.userId));
        setPinError("Хэт олон удаа буруу. 5 минут түр хүлээнэ үү.");
      } else {
        setPinError(
          `${res?.message || "Пин код буруу байна"} (${lock.remainingAttempts} оролдлого үлдсэн)`
        );
      }
    } catch {
      setPinError("Алдаа гарлаа. Дахин оролдоно уу.");
      setResetSignal((s) => s + 1);
    } finally {
      setPinLoading(false);
    }
  };

  const lockSeconds = Math.ceil(lockRemaining / 1000);
  const locked = lockRemaining > 0;

  const finishLogin = async (user: AuthLoginUser | null | undefined) => {
    setPinSetupOpen(false);
    setPendingLoginUser(null);
    await completeLoginAfterSuccess(user ?? undefined, nextPath);
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F8F5F0] px-4 py-6">
      {pendingLoginUser ? (
        <PinSetupOfferModal
          open={pinSetupOpen}
          user={pendingLoginUser}
          onLater={() => void finishLogin(pendingLoginUser)}
          onSuccess={() => void finishLogin({ ...pendingLoginUser, passcodeEnabled: true })}
        />
      ) : null}
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:max-w-md sm:p-8">
        <div className="mb-8 flex justify-center">
          <Image
            src="/img/torder-logo.png"
            alt="TOrder"
            width={180}
            height={54}
            priority
            className="h-11 w-auto object-contain sm:h-12"
          />
        </div>

        {selected ? (
          <div className="flex flex-col items-center gap-5">
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-700">
                {selected.initials}
              </span>
              <div className="text-center">
                <p className="font-semibold text-zinc-900">{selected.name}</p>
                <p className="text-xs text-zinc-500">4 оронтой пин код оруулна уу</p>
              </div>
            </div>

            {locked ? (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                Түр түгжигдсэн. {lockSeconds} секундын дараа дахин оролдоно уу.
              </p>
            ) : null}

            <PasscodeKeypad
              disabled={pinLoading || locked}
              error={pinError}
              resetSignal={resetSignal}
              onComplete={handlePasscode}
              onCancel={cancelPasscode}
            />

            <button
              type="button"
              onClick={cancelPasscode}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
            >
              ← Болих, нууц үгээр нэвтрэх
            </button>
          </div>
        ) : (
          <>
            {savedUsers.length > 0 ? (
              <div className="mb-6">
                <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Хадгалсан хэрэглэгчид
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {savedUsers.map((u) => (
                    <div
                      key={u.userId}
                      className="inline-flex max-w-full items-center rounded-full border border-zinc-200 bg-zinc-50/80 pr-1 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => openPasscode(u)}
                        className="flex min-w-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2 text-left transition hover:bg-orange-50"
                        title="Пин кодоор нэвтрэх"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                          {u.initials}
                        </span>
                        <span className="truncate text-sm font-medium text-zinc-800">
                          {u.name}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleRemoveSavedUser(event, u.userId)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
                        aria-label={`${u.name} устгах`}
                        title="Устгах"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold text-zinc-900">Нэвтрэх</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Хэрэглэгчийн нэр эсвэл имэйл, нууц үгээ оруулна уу
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login" className="text-sm font-medium text-zinc-700">
                  Хэрэглэгчийн нэр / Имэйл
                </label>
                <input
                  id="login"
                  name="login"
                  type="text"
                  autoComplete="username"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="h-11 rounded-lg border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                  Нууц үг
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-lg border border-zinc-300 bg-white px-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-lg bg-orange-600 text-sm font-semibold text-white shadow-md transition hover:bg-orange-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center">Ачааллаж байна...</div>}>
      <LoginForm />
    </Suspense>
  );
}

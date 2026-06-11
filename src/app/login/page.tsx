"use client";

import { USER_LOGIN } from "@/utils/APIConstant";
import { postApi } from "@/utils/common";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";

type LoginResponse = {
  success: boolean;
  message?: string;
  user?: {
    name: string;
    role: string;
  };
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin/users";

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F8F5F0] px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">Нэвтрэх</h1>
          <p className="mt-2 text-sm text-zinc-500">
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

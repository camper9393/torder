"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProfileView } from "@/service/profileService";
import {
  GET_AUTH_PROFILE,
  PATCH_AUTH_PROFILE,
  POST_AUTH_CHANGE_PASSWORD,
} from "@/utils/APIConstant";
import { getApi, patchApi, postApi } from "@/utils/common";
import PasscodeManager from "@/components/Auth/PasscodeManager";
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import React from "react";

type ProfileResponse = {
  success: boolean;
  message?: string;
  data?: ProfileView;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

export default function AdminProfilePage() {
  const [profile, setProfile] = React.useState<ProfileView | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [profileMessage, setProfileMessage] = React.useState("");
  const [profileError, setProfileError] = React.useState("");

  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordSaving, setPasswordSaving] = React.useState(false);
  const [passwordMessage, setPasswordMessage] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await getApi<ProfileResponse>({ url: GET_AUTH_PROFILE });
    if (!res?.success || !res.data) {
      setError(res?.message || "Профайл ачаалахад алдаа гарлаа");
      setLoading(false);
      return;
    }
    setProfile(res.data);
    setName(res.data.user.name);
    setEmail(res.data.user.email);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");
    setProfileError("");

    const res = await patchApi<ProfileResponse>({
      url: PATCH_AUTH_PROFILE,
      values: { name, email },
    });

    setProfileSaving(false);

    if (!res?.success) {
      setProfileError(res?.message || "Профайл хадгалахад алдаа гарлаа");
      return;
    }

    if (res.data) {
      setProfile(res.data);
      setName(res.data.user.name);
      setEmail(res.data.user.email);
    }

    setProfileMessage(res.message || "Профайл амжилттай шинэчлэгдлээ");
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");
    setPasswordError("");

    const res = await postApi<{ success: boolean; message?: string }>({
      url: POST_AUTH_CHANGE_PASSWORD,
      values: { currentPassword, newPassword, confirmPassword },
    });

    setPasswordSaving(false);

    if (!res?.success) {
      setPasswordError(res?.message || "Нууц үг солиход алдаа гарлаа");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage(res.message || "Нууц үг амжилттай солигдлоо");
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Профайл ачаалж байна...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error || "Профайл олдсонгүй"}
      </div>
    );
  }

  const { user, restaurant, capabilities, session } = profile;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Хэрэглэгчийн профайл</h1>
        <p className="mt-1 text-sm text-slate-600">
          Дансны мэдээлэл, эрх, нууц үгээ эндээс удирдана
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Дансны мэдээлэл</CardTitle>
          <CardDescription>
            Та энэ эрхээр нэвтэрсэн байна:{" "}
            <span className="font-semibold text-slate-900">
              {profile.roleLabel}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InfoRow label="Нэр" value={user.name} />
          <InfoRow label="Нэвтрэх нэр" value={user.username} />
          <InfoRow label="Имэйл" value={user.email} />
          <InfoRow label="Эрх" value={profile.roleLabel} />
          <InfoRow
            label="Төлөв"
            value={
              user.isActive ? (
                <span className="text-green-700">Идэвхтэй</span>
              ) : (
                <span className="text-red-600">Идэвхгүй</span>
              )
            }
          />
          <InfoRow label="Нэвтрэх дансны төрөл" value={profile.accountType} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Рестораны мэдээлэл</CardTitle>
          <CardDescription>
            Таны холбогдсон ресторан болон захиалгын багц
          </CardDescription>
        </CardHeader>
        <CardContent>
          {restaurant ? (
            <>
              <InfoRow label="Ресторан" value={restaurant.name} />
              <InfoRow label="Багц" value={restaurant.planLabel} />
              <InfoRow
                label="Захиалгын төлөв"
                value={restaurant.subscriptionLabel}
              />
              <InfoRow
                label="Дуусах огноо"
                value={formatDate(restaurant.expireDate)}
              />
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Platform түвшний данс — тодорхой нэг ресторонд холбогдоогүй
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Сессийн мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow
            label="Одоогийн ресторан"
            value={session.restaurantName ?? "—"}
          />
          <InfoRow label="Одоогийн эрх" value={session.roleLabel} />
          <InfoRow label="Дансны төлөв" value={session.accountStatus} />
          <InfoRow
            label="Захиалга дуусах"
            value={formatDate(session.subscriptionExpiry)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Эрхийн хураангуй</CardTitle>
          <CardDescription>
            Таны role-оор зөвшөөрөгдсөн болон хориглогдсон үйлдлүүд
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              Зөвшөөрөгдсөн үйлдлүүд
            </h3>
            {capabilities.allowed.length > 0 ? (
              <ul className="space-y-2">
                {capabilities.allowed.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Зөвшөөрөгдсөн үйлдэл байхгүй</p>
            )}
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <XCircle className="h-4 w-4" />
              Танд дараах үйлдэл хийх эрх байхгүй
            </h3>
            {capabilities.denied.length > 0 ? (
              <ul className="space-y-2">
                {capabilities.denied.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  >
                    <XCircle className="h-4 w-4 shrink-0 opacity-60" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-700">
                Бүх үйлдэлд хандах эрхтэй байна
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Профайл засах</CardTitle>
          <CardDescription>
            Зөвхөн нэр болон имэйлээ өөрчилж болно
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Нэр
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Имэйл
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-slate-500">
              Нэвтрэх нэр, эрх, ресторан, зөвшөөрлийг өөрчлөх боломжгүй
            </p>
            {profileError ? (
              <p className="text-sm text-red-600">{profileError}</p>
            ) : null}
            {profileMessage ? (
              <p className="text-sm text-green-700">{profileMessage}</p>
            ) : null}
            <Button type="submit" disabled={profileSaving}>
              {profileSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Хадгалж байна...
                </>
              ) : (
                "Хадгалах"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Нууц үг солих</CardTitle>
          <CardDescription>
            Өөрийн нууц үгээ аюулгүй байлгаарай
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Одоогийн нууц үг
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Шинэ нууц үг
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Шинэ нууц үг давтах
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
            {passwordError ? (
              <p className="text-sm text-red-600">{passwordError}</p>
            ) : null}
            {passwordMessage ? (
              <p className="text-sm text-green-700">{passwordMessage}</p>
            ) : null}
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Солиж байна...
                </>
              ) : (
                "Нууц үг солих"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PasscodeManager />

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <ShieldAlert className="h-5 w-5" />
            Аюулгүй байдлын зөвлөмж
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-sm text-amber-950/80">
            <li>Нууц үгээ бусдад дамжуулахгүй байх</li>
            <li>Эрх хүрэхгүй хэсгийг систем автоматаар хязгаарлана</li>
            <li>Нууц үг солисны дараа дахин нэвтрэх шаардлагатай байж болно</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

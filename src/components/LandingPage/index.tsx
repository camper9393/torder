"use client";

import { UserRole } from "@/constants/userRoles";
import { Button } from "@/components/ui/button";
import { USER_ME } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import {
  BarChart3,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  Shield,
  Tablet,
} from "lucide-react";
import Link from "next/link";
import React from "react";

const FEATURES = [
  {
    title: "Tablet order",
    description: "Ширээн дээрээс шууд захиалга авах, QR цэс",
    icon: Tablet,
  },
  {
    title: "POS management",
    description: "Захиалга, ширээ, төлбөр нэг дор удирдах",
    icon: LayoutDashboard,
  },
  {
    title: "Kitchen display",
    description: "Гал тогооны дэлгэц, бэлтгэлийн дараалал",
    icon: ChefHat,
  },
  {
    title: "Staff permissions",
    description: "Ажилтан, эрх, үүрэг тодорхой удирдлага",
    icon: Shield,
  },
  {
    title: "Reports",
    description: "Борлуулалт, бүтээгдэхүүн, тайлан статистик",
    icon: BarChart3,
  },
  {
    title: "Subscription management",
    description: "Багц, төлбөр, хугацаа platform түвшинд",
    icon: CreditCard,
  },
] as const;

export default function LandingPage() {
  const [role, setRole] = React.useState<UserRole | null>(null);
  const [authChecked, setAuthChecked] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await getApi<{ success: boolean; user?: { role: UserRole } }>({
          url: USER_ME,
        });
        if (!cancelled && res?.success && res.user?.role) {
          setRole(res.user.role);
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dashboardHref =
    role === UserRole.PLATFORM_OWNER ? "/platform/dashboard" : "/admin/dashboard";

  const showDashboardCta = authChecked && role !== null;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <section className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            Рестораны удирдлагын систем
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            TOrder Platform
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Ресторан, кафе, хоолны газрын захиалга, ширээ, гал тогоо, ажилтан,
            тайланг нэг дор удирдах систем.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
              <Link href="/login">Нэвтрэх</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/login">Шинэ ресторан бүртгүүлэх</Link>
            </Button>
          </div>

          {showDashboardCta ? (
            <div className="mt-6">
              <Button asChild variant="secondary">
                <Link href={dashboardHref}>
                  {role === UserRole.PLATFORM_OWNER
                    ? "Platform самбар руу орох"
                    : "Админ самбар руу орох"}
                </Link>
              </Button>
              <p className="mt-2 text-xs text-slate-400">
                Та аль хэдийн нэвтэрсэн байна
              </p>
            </div>
          ) : null}
        </section>

        <section className="mt-16 lg:mt-20">
          <h2 className="text-center text-xl font-semibold text-slate-900 sm:text-2xl">
            Системийн боломжууд
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
            Захиалгаас тайлан хүртэл — бүх үндсэн модуль нэг платформ дээр
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 py-6">
        <p className="text-center text-xs text-slate-400">
          © {new Date().getFullYear()} TOrder · QRMenu
        </p>
      </footer>
    </div>
  );
}

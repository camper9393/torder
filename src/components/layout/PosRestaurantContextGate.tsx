"use client";

import { Button } from "@/components/ui/button";
import { usePosRestaurantContext } from "@/hooks/usePosRestaurantContext";
import { requiresPosRestaurantContext } from "@/lib/posRoutes";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PosRestaurantContextGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { loaded, needsPosContextBlock } = usePosRestaurantContext();

  if (!requiresPosRestaurantContext(pathname)) {
    return <>{children}</>;
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Ачааллаж байна...
      </div>
    );
  }

  if (needsPosContextBlock) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Ресторан сонгоно уу</h1>
        <p className="max-w-md text-sm text-slate-600">
          Platform owner хэрэглэгч POS хэсэгт орохын өмнө ресторан контекст
          тохируулах шаардлагатай. Platform самбараас ресторан сонгоно уу.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/platform/dashboard">Platform самбар</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/platform/restaurants">Ресторанууд</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

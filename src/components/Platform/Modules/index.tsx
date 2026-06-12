"use client";

import { PlatformCard, PlatformPageHeader } from "@/components/Platform/shared";

const MODULES = [
  "POS",
  "Tablet Order",
  "Kitchen Display",
  "Inventory",
  "Reports",
  "Staff Management",
  "Payment",
  "Delivery",
  "Support",
] as const;

export default function PlatformModulesPage() {
  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Модулиуд"
        description="Ресторан бүрт идэвхжүүлэх модулууд (одоогоор зөвхөн харах)"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((mod) => (
          <PlatformCard key={mod}>
            <h3 className="font-semibold text-slate-900">{mod}</h3>
            <p className="mt-2 text-sm text-slate-500">
              Бүх идэвхтэй ресторанд нээлттэй (module lock хараахан хэрэгжээгүй)
            </p>
            <span className="mt-3 inline-block rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
              Идэвхтэй
            </span>
          </PlatformCard>
        ))}
      </div>
    </div>
  );
}

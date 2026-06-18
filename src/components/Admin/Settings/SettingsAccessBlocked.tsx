import { ShieldAlert } from "lucide-react";
import { SETTINGS_SECTION_DENIED_MESSAGE } from "@/lib/settingsSectionAccess";

export default function SettingsAccessBlocked() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <ShieldAlert className="h-6 w-6 text-slate-500" />
      </div>
      <p className="text-base font-semibold text-slate-900">
        {SETTINGS_SECTION_DENIED_MESSAGE}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Энэ хэсгийг засах эрх танд олгогдоогүй байна. Админтай холбогдоно уу.
      </p>
    </div>
  );
}

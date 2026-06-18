"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import SettingsAccessBlocked from "@/components/Admin/Settings/SettingsAccessBlocked";
import SettingsRestaurantSelector from "@/components/Admin/Settings/SettingsRestaurantSelector";
import {
  SettingsRestaurantProvider,
  useSettingsRestaurantContext,
} from "@/components/Admin/Settings/SettingsRestaurantContext";
import { SETTINGS_NAV_ITEMS } from "@/components/Admin/Settings/settingsNavConfig";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import {
  canAccessSettingsSection,
  SETTINGS_SECTION_DENIED_MESSAGE,
} from "@/lib/settingsSectionAccess";
import { cn } from "@/lib/utils";

export default function SettingsShell({
  isPlatformOwner,
  sessionRestaurantId,
  children,
}: {
  isPlatformOwner: boolean;
  sessionRestaurantId: string | null;
  children: React.ReactNode;
}) {
  return (
    <SettingsRestaurantProvider
      isPlatformOwner={isPlatformOwner}
      sessionRestaurantId={sessionRestaurantId}
    >
      <SettingsShellContent>{children}</SettingsShellContent>
    </SettingsRestaurantProvider>
  );
}

function SettingsShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const { user, loaded: userLoaded } = useSidebarUser();
  const { requiresRestaurantSelection, isPlatformOwner, restaurantId } =
    useSettingsRestaurantContext();

  const activeNav = SETTINGS_NAV_ITEMS.find(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const skipRestaurantGate = activeNav?.skipRestaurantGate === true;
  const blockForRestaurantSelection =
    requiresRestaurantSelection && !skipRestaurantGate;

  const activeSectionAllowed =
    userLoaded && activeNav && user
      ? canAccessSettingsSection(user, activeNav.key)
      : true;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Тохиргоо</h1>
        <p className="mt-1 text-sm text-slate-600">
          Рестораны удирдлагын төв — байгууллага, салбар, төлбөр, ажилтан
        </p>

        {isPlatformOwner && !skipRestaurantGate ? (
          <SettingsRestaurantSelector />
        ) : null}

        {!isPlatformOwner && !restaurantId ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Рестораны контекст олдсонгүй. Админтай холбогдоно уу.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav className="shrink-0 lg:w-64" aria-label="Тохиргооны дэд цэс">
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {SETTINGS_NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              const allowed =
                userLoaded && user
                  ? canAccessSettingsSection(user, item.key)
                  : true;

              const linkClass = cn(
                "flex min-h-11 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition touch-manipulation",
                active && allowed
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : allowed
                    ? "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-60"
              );

              const inner = (
                <>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap lg:whitespace-normal">
                    {item.label}
                  </span>
                </>
              );

              return (
                <li key={item.key} className="shrink-0 lg:shrink">
                  {!allowed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={linkClass}
                          aria-disabled="true"
                          role="link"
                        >
                          {inner}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        {SETTINGS_SECTION_DENIED_MESSAGE}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link href={item.href} className={linkClass}>
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          {blockForRestaurantSelection ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-base font-medium text-slate-800">
                Эхлээд тохиргоо засах ресторанаа сонгоно уу.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Дээрх &quot;Ресторан сонгох&quot; жагсаалтаас ресторан сонгосны
                дараа тохиргооны хэсгүүд идэвхжинэ.
              </p>
            </div>
          ) : userLoaded && activeNav && !activeSectionAllowed ? (
            <SettingsAccessBlocked />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

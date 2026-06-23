"use client";

import React from "react";
import { Store } from "lucide-react";

import { useSettingsRestaurantContext } from "@/components/Admin/Settings/SettingsRestaurantContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Restaurant } from "@/types/restaurant";
import { GET_PLATFORM_RESTAURANTS } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import { cn } from "@/lib/utils";

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Идэвхтэй",
  expired: "Дууссан",
  suspended: "Түр зогссон",
};

const SUBSCRIPTION_BADGE_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  expired: "bg-amber-50 text-amber-700 ring-amber-200/80",
  suspended: "bg-slate-100 text-slate-600 ring-slate-200/80",
};

function RestaurantAvatar({ name }: { name: string }) {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200/80"
      aria-hidden
    >
      <Store className="h-4 w-4" strokeWidth={1.75} />
      <span className="sr-only">{name}</span>
    </div>
  );
}

function StatusBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ring-1 ring-inset",
        className
      )}
    >
      {children}
    </span>
  );
}

function RestaurantBadges({ restaurant }: { restaurant: Restaurant }) {
  const subscriptionLabel =
    SUBSCRIPTION_STATUS_LABELS[restaurant.subscriptionStatus] ??
    restaurant.subscriptionStatus;

  return (
    <div className="flex shrink-0 items-center gap-1">
      <StatusBadge
        className={
          SUBSCRIPTION_BADGE_STYLES[restaurant.subscriptionStatus] ??
          "bg-slate-100 text-slate-600 ring-slate-200/80"
        }
      >
        {subscriptionLabel}
      </StatusBadge>
      <StatusBadge
        className={
          restaurant.isActive
            ? "bg-sky-50 text-sky-700 ring-sky-200/80"
            : "bg-slate-100 text-slate-500 ring-slate-200/80"
        }
      >
        {restaurant.isActive ? "Нээлттэй" : "Хаалттай"}
      </StatusBadge>
    </div>
  );
}

function RestaurantOptionRow({
  restaurant,
  showBadges = true,
}: {
  restaurant: Restaurant;
  showBadges?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5">
      <RestaurantAvatar name={restaurant.name} />
      <div className="min-w-0 flex-1 text-left leading-tight">
        <p className="truncate text-sm font-medium text-slate-900">
          {restaurant.name}
        </p>
        {restaurant.email ? (
          <p className="truncate text-xs text-slate-500">{restaurant.email}</p>
        ) : null}
      </div>
      {showBadges ? <RestaurantBadges restaurant={restaurant} /> : null}
    </div>
  );
}

export default function SettingsRestaurantSelector() {
  const { restaurantId, isPlatformOwner, setSelectedRestaurantId } =
    useSettingsRestaurantContext();
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isPlatformOwner) return;

    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await getApi<{ success: boolean; data?: Restaurant[] }>({
        url: GET_PLATFORM_RESTAURANTS,
      });
      if (!cancelled && res?.success && res.data) {
        setRestaurants(res.data);
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isPlatformOwner]);

  const effectiveRestaurantId = mounted
    ? restaurantId ??
      (restaurants.length === 1 ? String(restaurants[0]._id) : null)
    : null;

  React.useEffect(() => {
    if (
      !mounted ||
      !isPlatformOwner ||
      restaurantId ||
      restaurants.length !== 1
    ) {
      return;
    }
    setSelectedRestaurantId(String(restaurants[0]._id));
  }, [
    mounted,
    isPlatformOwner,
    restaurantId,
    restaurants,
    setSelectedRestaurantId,
  ]);

  if (!isPlatformOwner) return null;

  const selected =
    effectiveRestaurantId != null
      ? restaurants.find((r) => String(r._id) === effectiveRestaurantId)
      : undefined;
  const selectValue = selected ? String(selected._id) : "";
  const placeholder = "Ресторан сонгох";

  return (
    <div className="mt-3 rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm">
      <label
        htmlFor="settings-restaurant-select"
        className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        Ресторан сонгох
      </label>

      <Select
        value={selectValue}
        onValueChange={setSelectedRestaurantId}
        disabled={loading || restaurants.length === 0}
      >
        <SelectTrigger
          id="settings-restaurant-select"
          className={cn(
            "h-12 w-full max-w-xl items-center gap-2 border-slate-200 bg-slate-50/50 px-2.5 py-0",
            "shadow-none hover:bg-slate-50 focus-visible:ring-slate-300/60",
            "data-[size=default]:h-12"
          )}
        >
          <SelectValue className="sr-only" placeholder={placeholder} />
          {selected ? (
            <RestaurantOptionRow restaurant={selected} />
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200/80">
                <Store className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <span className="text-sm text-slate-500">{placeholder}</span>
            </div>
          )}
        </SelectTrigger>

        <SelectContent
          align="start"
          className="max-h-72 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] p-1"
        >
          {restaurants.map((restaurant) => (
            <SelectItem
              key={restaurant._id}
              value={String(restaurant._id)}
              className={cn(
                "cursor-pointer rounded-md py-2 pr-3 pl-2",
                "[&_[data-slot=select-item-indicator]]:hidden"
              )}
            >
              <RestaurantOptionRow restaurant={restaurant} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {loading ? (
        <p className="mt-1.5 text-xs text-slate-500">Ачааллаж байна...</p>
      ) : null}
      {!loading && restaurants.length === 0 ? (
        <p className="mt-1.5 text-xs text-amber-700">Ресторан олдсонгүй.</p>
      ) : null}
    </div>
  );
}

"use client";

import React from "react";

import { useSettingsRestaurantContext } from "@/components/Admin/Settings/SettingsRestaurantContext";

export function useSettingsApiParams(
  extra?: Record<string, string | number | undefined>
): Record<string, string> | undefined {
  const { restaurantId, isPlatformOwner } = useSettingsRestaurantContext();
  const extraKey = extra ? JSON.stringify(extra) : "";

  return React.useMemo(() => {
    const merged: Record<string, string> = {};

    if (isPlatformOwner && restaurantId) {
      merged.restaurantId = restaurantId;
    }

    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        if (value !== undefined && value !== "") {
          merged[key] = String(value);
        }
      }
    }

    return Object.keys(merged).length > 0 ? merged : undefined;
  }, [restaurantId, isPlatformOwner, extra, extraKey]);
}

export function useSettingsApiUrl(
  base: string,
  extra?: Record<string, string | undefined>
): string {
  const params = useSettingsApiParams(extra);
  if (!params) return base;
  const qs = new URLSearchParams(params).toString();
  return `${base}?${qs}`;
}

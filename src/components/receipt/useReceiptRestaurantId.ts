"use client";

import React from "react";

import { USER_ME } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";

const SESSION_FETCH_TIMEOUT_MS = 5000;
export const RECEIPT_CONTEXT_RESTAURANT_STORAGE_KEY =
  "torder-settings-restaurant-id";

function readStoredRestaurantId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const stored = window.localStorage.getItem(RECEIPT_CONTEXT_RESTAURANT_STORAGE_KEY);
  return stored?.trim() || undefined;
}

export function useReceiptRestaurantId({
  enabled,
  orderRestaurantId,
  tableRestaurantId,
}: {
  enabled: boolean;
  orderRestaurantId?: string | null;
  tableRestaurantId?: string | null;
}) {
  const [sessionRestaurantId, setSessionRestaurantId] = React.useState<
    string | undefined
  >();
  const [sessionChecked, setSessionChecked] = React.useState(!enabled);

  const storedRestaurantId = React.useMemo(
    () => (enabled ? readStoredRestaurantId() : undefined),
    [enabled]
  );

  const immediateId = React.useMemo(() => {
    const fromOrder = orderRestaurantId?.trim();
    if (fromOrder) return fromOrder;
    const fromTable = tableRestaurantId?.trim();
    if (fromTable) return fromTable;
    if (storedRestaurantId) return storedRestaurantId;
    return undefined;
  }, [orderRestaurantId, tableRestaurantId, storedRestaurantId]);

  React.useEffect(() => {
    if (!enabled) {
      setSessionChecked(true);
      return;
    }

    if (immediateId) {
      setSessionChecked(true);
      return;
    }

    let cancelled = false;
    setSessionChecked(false);

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        setSessionChecked(true);
      }
    }, SESSION_FETCH_TIMEOUT_MS);

    void (async () => {
      try {
        const res = await getApi<{
          success: boolean;
          user?: { restaurantId?: string };
        }>({ url: USER_ME });
        if (!cancelled && res?.success && res.user?.restaurantId) {
          setSessionRestaurantId(String(res.user.restaurantId));
        }
      } catch {
        // session restaurantId заавал биш
      } finally {
        if (!cancelled) {
          window.clearTimeout(timeoutId);
          setSessionChecked(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [enabled, immediateId]);

  return {
    restaurantId: immediateId ?? sessionRestaurantId,
    ready: !enabled || Boolean(immediateId) || sessionChecked,
  };
}

export function buildReceiptContextParams({
  restaurantId,
  merchantId,
}: {
  restaurantId?: string | null;
  merchantId?: string | null;
}): Record<string, string> | undefined {
  const params: Record<string, string> = {};
  const resolvedRestaurantId = restaurantId?.trim();
  const resolvedMerchantId = merchantId?.trim();

  if (resolvedRestaurantId) {
    params.restaurantId = resolvedRestaurantId;
  }
  if (resolvedMerchantId) {
    params.merchantId = resolvedMerchantId;
  }

  return Object.keys(params).length > 0 ? params : undefined;
}

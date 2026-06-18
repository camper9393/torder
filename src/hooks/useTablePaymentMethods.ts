"use client";

import React from "react";

import { GET_PAYMENT_METHODS } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import {
  FALLBACK_PAYMENT_METHOD_OPTIONS,
  type PaymentMethodOption,
} from "@/utils/paymentMethodOptions";

const PAYMENT_METHODS_TIMEOUT_MS = 8000;

export function useTablePaymentMethods(
  enabled = true,
  apiParams?: Record<string, string>
) {
  const [options, setOptions] = React.useState<PaymentMethodOption[]>(
    FALLBACK_PAYMENT_METHOD_OPTIONS
  );
  const [loading, setLoading] = React.useState(enabled);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await Promise.race([
        getApi<{
          success: boolean;
          message?: string;
          data?: { options?: PaymentMethodOption[] };
        }>({ url: GET_PAYMENT_METHODS, param: apiParams }),
        new Promise<undefined>((resolve) => {
          window.setTimeout(() => resolve(undefined), PAYMENT_METHODS_TIMEOUT_MS);
        }),
      ]);

      if (res?.success && Array.isArray(res.data?.options)) {
        if (res.data.options.length > 0) {
          setOptions(res.data.options);
        } else {
          setOptions(FALLBACK_PAYMENT_METHOD_OPTIONS);
          setError("Идэвхтэй төлбөрийн арга тохируулаагүй байна");
        }
      } else {
        setOptions(FALLBACK_PAYMENT_METHOD_OPTIONS);
        if (res && !res.success) {
          setError(res.message || "Төлбөрийн арга ачаалахад алдаа");
        }
      }
    } catch {
      setOptions(FALLBACK_PAYMENT_METHOD_OPTIONS);
      setError("Төлбөрийн арга ачаалахад алдаа");
    } finally {
      setLoading(false);
    }
  }, [enabled, apiParams]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { options, loading, error, reload: load };
}

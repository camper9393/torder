"use client";

import React from "react";

import {
  normalizeReceiptData,
  RECEIPT_COMPANY_DEFAULTS,
  RECEIPT_FORM_DEFAULTS,
  type ReceiptCompanyInfo,
  type ReceiptData,
} from "@/components/receipt/receiptTypes";
import {
  GET_ADMIN_SETTINGS_COMPANY,
  GET_ADMIN_SETTINGS_RECEIPT,
  GET_RECEIPT_CONTEXT,
} from "@/utils/APIConstant";
import { getApi } from "@/utils/common";

const PRINT_SETTINGS_TIMEOUT_MS = 8000;

type CompanyPayload = {
  nameMn?: string;
  nameEn?: string;
  logoUrl?: string;
  address?: string;
  phone1?: string;
  phone2?: string;
};

function mapCompanyPayload(payload?: CompanyPayload | null): ReceiptCompanyInfo {
  if (!payload) {
    return RECEIPT_COMPANY_DEFAULTS;
  }

  return {
    name: payload.nameMn?.trim() || payload.nameEn?.trim() || "",
    address: payload.address?.trim() || "",
    phone: payload.phone1?.trim() || "",
    phone2: payload.phone2?.trim() || "",
    logoUrl: payload.logoUrl?.trim() || "",
  };
}

function applyPrintFallback(
  setSettings: React.Dispatch<React.SetStateAction<ReceiptData>>,
  setCompany: React.Dispatch<React.SetStateAction<ReceiptCompanyInfo>>,
  message?: string,
  setError?: React.Dispatch<React.SetStateAction<string>>
) {
  setSettings(RECEIPT_FORM_DEFAULTS);
  setCompany(RECEIPT_COMPANY_DEFAULTS);
  if (message && setError) {
    setError(message);
  }
}

async function fetchPrintContext(
  apiParams?: Record<string, string>
): Promise<
  | {
      ok: true;
      company: ReceiptCompanyInfo;
      settings: ReceiptData;
    }
  | { ok: false; message: string }
> {
  const contextRes = await Promise.race([
    getApi<{
      success: boolean;
      message?: string;
      data?: {
        company?: CompanyPayload;
        receipt?: Partial<ReceiptData>;
        companySettings?: CompanyPayload;
        receiptSettings?: Partial<ReceiptData>;
      };
    }>({ url: GET_RECEIPT_CONTEXT, param: apiParams }),
    new Promise<undefined>((resolve) => {
      window.setTimeout(() => resolve(undefined), PRINT_SETTINGS_TIMEOUT_MS);
    }),
  ]);

  if (!contextRes) {
    return {
      ok: false,
      message: "Баримтын тохиргоо ачаалахад хэт удаан байна",
    };
  }

  if (contextRes.success && contextRes.data) {
    const companyPayload =
      contextRes.data.companySettings ?? contextRes.data.company;
    const receiptPayload =
      contextRes.data.receiptSettings ?? contextRes.data.receipt;

    return {
      ok: true,
      company: mapCompanyPayload(companyPayload),
      settings: normalizeReceiptData(receiptPayload),
    };
  }

  return {
    ok: false,
    message:
      contextRes.message ||
      "Баримтын тохиргоо ачаалахад алдаа гарлаа. Анхдагч тохиргоогоор хэвлэнэ.",
  };
}

export type UseReceiptSettingsOptions = {
  /** Settings хуудас: admin API. Төлбөрийн баримт: tenant scope-той context API. */
  source?: "admin" | "print";
};

export function useReceiptSettings(
  enabled = true,
  apiParams?: Record<string, string>,
  options?: UseReceiptSettingsOptions
) {
  const source = options?.source ?? "admin";
  const [settings, setSettings] = React.useState<ReceiptData>(
    RECEIPT_FORM_DEFAULTS
  );
  const [company, setCompany] = React.useState<ReceiptCompanyInfo>(
    RECEIPT_COMPANY_DEFAULTS
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
      if (source === "print") {
        const result = await fetchPrintContext(apiParams);
        if (result.ok) {
          setSettings(result.settings);
          setCompany(result.company);
        } else {
          applyPrintFallback(setSettings, setCompany, result.message, setError);
        }
        return;
      }

      const [receiptRes, companyRes] = await Promise.all([
        getApi<{
          success: boolean;
          message?: string;
          data?: Partial<ReceiptData>;
        }>({ url: GET_ADMIN_SETTINGS_RECEIPT, param: apiParams }),
        getApi<{ success: boolean; data?: CompanyPayload }>({
          url: GET_ADMIN_SETTINGS_COMPANY,
          param: apiParams,
        }),
      ]);

      if (receiptRes?.success && receiptRes.data) {
        setSettings(normalizeReceiptData(receiptRes.data));
      } else {
        setSettings(RECEIPT_FORM_DEFAULTS);
        if (receiptRes && !receiptRes.success) {
          setError(receiptRes.message || "Баримтын тохиргоо ачаалахад алдаа");
        }
      }

      if (companyRes?.success && companyRes.data) {
        setCompany(mapCompanyPayload(companyRes.data));
      } else {
        setCompany(RECEIPT_COMPANY_DEFAULTS);
      }
    } catch {
      if (source === "print") {
        applyPrintFallback(
          setSettings,
          setCompany,
          "Баримтын тохиргоо ачаалахад алдаа гарлаа. Анхдагч тохиргоогоор хэвлэнэ.",
          setError
        );
      } else {
        setSettings(RECEIPT_FORM_DEFAULTS);
        setCompany(RECEIPT_COMPANY_DEFAULTS);
        setError("Баримтын тохиргоо ачаалахад алдаа");
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, apiParams, source]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return { settings, company, loading, error, reload: load };
}

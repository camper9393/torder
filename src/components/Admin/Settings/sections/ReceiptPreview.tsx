"use client";

import React from "react";

import { buildReceiptPreviewRenderData } from "@/components/receipt/buildReceiptRenderData";
import ReceiptDocument from "@/components/receipt/ReceiptDocument";
import { EMPTY_INFO_LABEL } from "@/components/receipt/receiptCompany";
import {
  normalizeReceiptData,
  type ReceiptData,
} from "@/components/receipt/receiptTypes";
import { useReceiptSettings } from "@/components/receipt/useReceiptSettings";
import { useSettingsApiParams } from "@/components/Admin/Settings/useSettingsApi";
import { cn } from "@/lib/utils";

export default function ReceiptPreview({
  settings,
  refreshToken = 0,
}: {
  settings: ReceiptData;
  refreshToken?: number;
}) {
  const settingsApiParam = useSettingsApiParams();
  const { company, loading, reload } = useReceiptSettings(true, settingsApiParam);
  const [dateLabel, setDateLabel] = React.useState("");

  React.useEffect(() => {
    setDateLabel(
      new Date().toLocaleString("mn-MN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    );
  }, []);

  React.useEffect(() => {
    if (refreshToken > 0) {
      void reload();
    }
  }, [refreshToken, reload]);

  const normalized = normalizeReceiptData(settings);

  const previewData = React.useMemo(() => {
    if (!dateLabel) return null;
    return buildReceiptPreviewRenderData({
      company,
      settings: normalized,
      dateLabel,
    });
  }, [company, normalized, dateLabel]);

  const hasCompanyData =
    Boolean(company.name.trim()) ||
    Boolean(company.address.trim()) ||
    Boolean(company.phone.trim()) ||
    Boolean(company.phone2.trim()) ||
    Boolean(company.logoUrl.trim());

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        Live preview · {normalized.receiptSize}
      </p>
      {!hasCompanyData && !loading ? (
        <p className="mb-3 max-w-xs text-center text-xs text-amber-700">
          Байгууллагын мэдээлэл оруулаагүй байна.{" "}
          <span className="font-medium">{EMPTY_INFO_LABEL}</span> гэж харагдана.
        </p>
      ) : null}
      {loading || !previewData ? (
        <p className="text-sm text-slate-500">Урьдчилан харах ачааллаж байна...</p>
      ) : (
        <div
          className={cn(
            "kitchen-bill-receipt rounded-sm border border-slate-300 bg-white shadow-lg",
            normalized.receiptSize === "58mm"
              ? "receipt-size-58mm w-[220px]"
              : "receipt-size-80mm w-[300px]"
          )}
        >
          <ReceiptDocument settings={normalized} data={previewData} />
        </div>
      )}
    </div>
  );
}

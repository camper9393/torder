"use client";

import React from "react";
import { Delete, Pencil } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { POST_TABLE_PAY } from "@/utils/APIConstant";
import { ApiResponse } from "@/utils/api";
import { postApi } from "@/utils/common";
import { formatPrice } from "@/utils/currency";
import { cn } from "@/lib/utils";
import {
  DISCOUNT_PRESETS,
  TABLE_PAYMENT_METHODS,
  TABLE_VAT_TYPES,
  type TablePaymentMethod,
  type TablePaymentReceiptData,
  type TableVatType,
  appendKeypadDigit,
  backspaceKeypadInput,
  estimateVatAmount,
  parsePaidKeypadInput,
} from "@/utils/tablePayment";

const KEYPAD_KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["00", "0", "←"],
] as const;

const GUEST_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type TablePaymentOrderLine = {
  key: string;
  label: string;
  amount: number;
};

type TablePaymentModalProps = {
  open: boolean;
  onClose: () => void;
  tableName: string;
  tableLabel: string;
  subtotal: number;
  orderLines?: TablePaymentOrderLine[];
  merchantId?: string;
  onPaid: (receipt: TablePaymentReceiptData) => void;
  onPrintDraft: () => void;
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </p>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

function ChoiceButton({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-12 rounded-xl border px-3 text-sm font-semibold transition touch-manipulation sm:min-h-[3rem]",
        active
          ? "border-[#1E5EFF] bg-[#1E5EFF] text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-800 hover:border-[#1E5EFF]/40 hover:bg-[#1E5EFF]/5",
        className
      )}
    >
      {children}
    </button>
  );
}

export default function TablePaymentModal({
  open,
  onClose,
  tableName,
  tableLabel,
  subtotal,
  orderLines = [],
  merchantId,
  onPaid,
  onPrintDraft,
}: TablePaymentModalProps) {
  const [guestCount, setGuestCount] = React.useState(2);
  const [guestEditOpen, setGuestEditOpen] = React.useState(false);
  const [guestDraft, setGuestDraft] = React.useState("2");
  const [paymentMethod, setPaymentMethod] =
    React.useState<TablePaymentMethod>("Бэлэн");
  const [vatType, setVatType] = React.useState<TableVatType>("НӨАТ-гүй");
  const [discountPercent, setDiscountPercent] = React.useState<number | null>(
    null
  );
  const [customDiscount, setCustomDiscount] = React.useState("");
  const [paidInput, setPaidInput] = React.useState("0");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setGuestCount(2);
    setGuestEditOpen(false);
    setGuestDraft("2");
    setPaymentMethod("Бэлэн");
    setVatType("НӨАТ-гүй");
    setDiscountPercent(null);
    setCustomDiscount("");
    setPaidInput("0");
    setSubmitting(false);
  }, [open, tableName]);

  const percentDiscount =
    discountPercent != null
      ? Math.round((subtotal * discountPercent) / 100)
      : 0;
  const customDiscountAmount = Math.min(
    Math.max(0, Math.round(Number(customDiscount) || 0)),
    subtotal
  );
  const discountAmount =
    customDiscount.trim() !== "" ? customDiscountAmount : percentDiscount;
  const amountDue = Math.max(0, subtotal - discountAmount);
  const vatAmount = estimateVatAmount(amountDue, vatType);

  const paidAmount =
    paymentMethod === "Бэлэн"
      ? parsePaidKeypadInput(paidInput)
      : amountDue;
  const changeAmount = Math.max(0, paidAmount - amountDue);

  React.useEffect(() => {
    if (paymentMethod !== "Бэлэн") {
      setPaidInput(String(amountDue || 0));
    }
  }, [paymentMethod, amountDue]);

  const handleKeypad = (key: string) => {
    if (paymentMethod !== "Бэлэн") return;
    if (key === "←") {
      setPaidInput((prev) => backspaceKeypadInput(prev));
      return;
    }
    setPaidInput((prev) => appendKeypadDigit(prev, key));
  };

  const applyGuestDraft = () => {
    const value = Math.floor(Number(guestDraft));
    if (!Number.isFinite(value) || value < 1 || value > 99) {
      toast.error("1–99 хооронд зочдын тоо оруулна уу");
      return;
    }
    setGuestCount(value);
    setGuestEditOpen(false);
  };

  const handlePay = async () => {
    if (subtotal <= 0) {
      toast.error("Төлөх дүн байхгүй байна");
      return;
    }
    if (paidAmount < amountDue) {
      toast.error("Төлсөн дүн хүрэлцэхгүй байна");
      return;
    }

    setSubmitting(true);
    try {
      const res = await postApi<
        ApiResponse<{
          subtotal: number;
          discountAmount: number;
          amountDue: number;
          paidAmount: number;
          changeAmount: number;
          paymentMethod: string;
          vatType: string;
          guestCount?: number;
          paidAt: string;
        }>
      >({
        url: POST_TABLE_PAY,
        values: {
          tableName,
          ...(merchantId ? { merchantId } : {}),
          paymentMethod,
          vatType,
          guestCount,
          discountAmount,
          paidAmount,
          changeAmount,
        },
      });

      if (!res?.success || !res.data) {
        toast.error(res?.message || "Төлбөр бүртгэхэд алдаа гарлаа");
        return;
      }

      onPaid({
        subtotal: res.data.subtotal,
        discountAmount: res.data.discountAmount,
        amountDue: res.data.amountDue,
        paidAmount: res.data.paidAmount,
        changeAmount: res.data.changeAmount,
        paymentMethod,
        vatType,
        guestCount,
        vatAmount,
        paidAt: res.data.paidAt,
      });
    } catch {
      toast.error("Төлбөр бүртгэхэд алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent
        centered
        showCloseButton={false}
        className={cn(
          "z-[70] flex h-[90vh] max-h-[90vh] w-[90vw] max-w-[1200px] flex-col gap-0 overflow-hidden rounded-2xl border-slate-200 p-0",
          "!max-w-[min(1200px,90vw)]"
        )}
      >
        <header className="shrink-0 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <DialogTitle className="text-xl font-bold text-slate-900 sm:text-2xl">
            Төлбөр төлөх
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500">{tableLabel}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/60 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            {/* Left column */}
            <div className="flex flex-col gap-6">
              <SectionCard>
                <SectionTitle>Зочдын тоо</SectionTitle>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="grid min-w-0 flex-1 grid-cols-5 gap-2 sm:grid-cols-9">
                    {GUEST_COUNTS.map((count) => (
                      <ChoiceButton
                        key={count}
                        active={!guestEditOpen && guestCount === count}
                        onClick={() => {
                          setGuestCount(count);
                          setGuestEditOpen(false);
                        }}
                        className="min-h-11 px-0 sm:min-h-12"
                      >
                        {count}
                      </ChoiceButton>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl sm:h-12 sm:w-12"
                    onClick={() => {
                      setGuestDraft(String(guestCount));
                      setGuestEditOpen((v) => !v);
                    }}
                    aria-label="Зочдын тоо засах"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                {guestEditOpen ? (
                  <div className="mt-3 flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={guestDraft}
                      onChange={(e) => setGuestDraft(e.target.value)}
                      className="h-11"
                    />
                    <Button
                      type="button"
                      className="h-11 shrink-0 bg-[#1E5EFF] px-5 text-white hover:bg-[#1548D4]"
                      onClick={applyGuestDraft}
                    >
                      OK
                    </Button>
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard>
                <SectionTitle>Төлбөрийн хэлбэр</SectionTitle>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {TABLE_PAYMENT_METHODS.map((method) => (
                    <ChoiceButton
                      key={method}
                      active={paymentMethod === method}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method}
                    </ChoiceButton>
                  ))}
                </div>
                {paymentMethod === "QPay" ? (
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                    QPay QR код — удахгүй нэмэгдэнэ (placeholder)
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard>
                <SectionTitle>Хөнгөлөлт</SectionTitle>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {DISCOUNT_PRESETS.map((preset) => (
                    <ChoiceButton
                      key={preset}
                      active={
                        customDiscount.trim() === "" &&
                        discountPercent === preset
                      }
                      onClick={() => {
                        setDiscountPercent(preset);
                        setCustomDiscount("");
                      }}
                    >
                      {preset}%
                    </ChoiceButton>
                  ))}
                </div>
                <Input
                  type="number"
                  min={0}
                  max={subtotal}
                  placeholder="Дүнгээр (₮)"
                  value={customDiscount}
                  onChange={(e) => {
                    setCustomDiscount(e.target.value);
                    if (e.target.value.trim()) setDiscountPercent(null);
                  }}
                  className="mt-3 h-11"
                />
              </SectionCard>

              <SectionCard className="flex min-h-[8rem] flex-col">
                <SectionTitle>Захиалгын жагсаалт</SectionTitle>
                {orderLines.length === 0 ? (
                  <p className="text-sm text-slate-500">Захиалга байхгүй</p>
                ) : (
                  <ul className="max-h-48 space-y-2 overflow-y-auto pr-1 sm:max-h-56">
                    {orderLines.map((line) => (
                      <li
                        key={line.key}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 flex-1 leading-snug text-slate-800">
                          {line.label}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                          {formatPrice(line.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-6">
              <SectionCard>
                <SectionTitle>Баримтын төрөл</SectionTitle>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                  {TABLE_VAT_TYPES.map((type) => (
                    <ChoiceButton
                      key={type}
                      active={vatType === type}
                      onClick={() => setVatType(type)}
                      className="text-xs sm:text-sm"
                    >
                      {type}
                    </ChoiceButton>
                  ))}
                </div>
              </SectionCard>

              <SectionCard>
                <SectionTitle>Дүнгийн хураангуй</SectionTitle>
                <div className="space-y-3 text-sm sm:text-base">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">Нийт дүн</span>
                    <span className="font-semibold tabular-nums">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">Хөнгөлөлт</span>
                    <span className="font-semibold tabular-nums text-red-600">
                      {discountAmount > 0
                        ? `-${formatPrice(discountAmount)}`
                        : "—"}
                    </span>
                  </div>
                  {vatType !== "НӨАТ-гүй" ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-600">НӨАТ (тооцоолол)</span>
                      <span className="font-semibold tabular-nums">
                        {formatPrice(vatAmount)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base sm:text-lg">
                    <span className="font-bold text-slate-900">Төлөх дүн</span>
                    <span className="font-bold tabular-nums text-[#1E5EFF]">
                      {formatPrice(amountDue)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">Төлсөн дүн</span>
                    <span className="font-semibold tabular-nums">
                      {formatPrice(paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-600">Хариулт</span>
                    <span className="font-semibold tabular-nums text-emerald-700">
                      {formatPrice(changeAmount)}
                    </span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard>
                <SectionTitle>Тооны товчлуур</SectionTitle>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {KEYPAD_KEYS.flat().map((key) => (
                    <button
                      key={key}
                      type="button"
                      disabled={paymentMethod !== "Бэлэн" || submitting}
                      onClick={() => handleKeypad(key)}
                      className={cn(
                        "flex h-14 min-h-[3.5rem] items-center justify-center rounded-xl border border-slate-200 bg-white text-2xl font-bold text-slate-900 shadow-sm transition touch-manipulation",
                        "sm:h-16 sm:min-h-[4rem] sm:text-3xl",
                        "hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                      )}
                    >
                      {key === "←" ? (
                        <Delete className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />
                      ) : (
                        key
                      )}
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              className="min-h-[3.25rem] rounded-xl text-base font-semibold touch-manipulation"
              onClick={onClose}
              disabled={submitting}
            >
              Болих
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-[3.25rem] rounded-xl text-base font-semibold touch-manipulation"
              onClick={onPrintDraft}
              disabled={submitting || subtotal <= 0}
            >
              Баримт хэвлэх
            </Button>
            <Button
              type="button"
              className="min-h-[3.25rem] rounded-xl bg-[#1E5EFF] text-base font-bold text-white hover:bg-[#1548D4] touch-manipulation"
              onClick={() => void handlePay()}
              disabled={submitting || subtotal <= 0}
            >
              {submitting ? "Бүртгэж байна..." : "Төлбөр төлөх"}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

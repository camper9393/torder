"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GET_REFUND_ELIGIBILITY, POST_REFUND } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi, postApi } from "@/utils/common"
import { formatPrice } from "@/utils/currency"
import type {
  CreateRefundPayload,
  RefundEligibility,
  RefundLineInput,
} from "@/types/refund"
import { REFUND_REASON_LABELS } from "@/types/refund"
import type { RefundReason, RefundType } from "@/model/refund"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

type LineState = {
  selected: boolean
  quantity: number
  returnToInventory: boolean
}

type RefundModalProps = {
  orderId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function RefundModal({
  orderId,
  open,
  onOpenChange,
  onSuccess,
}: RefundModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [eligibility, setEligibility] = React.useState<RefundEligibility | null>(
    null
  )
  const [refundType, setRefundType] = React.useState<RefundType>("partial")
  const [reason, setReason] = React.useState<RefundReason | "">("")
  const [lineState, setLineState] = React.useState<Record<number, LineState>>(
    {}
  )

  const loadEligibility = React.useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    const res = await getApi<ApiResponse<RefundEligibility>>({
      url: GET_REFUND_ELIGIBILITY(orderId),
    })
    setLoading(false)

    if (!res?.success || !res.data) {
      toast.error(res?.message || "Буцаалтын мэдээлэл ачаалж чадсангүй")
      return
    }

    setEligibility(res.data)
    const initial: Record<number, LineState> = {}
    for (const line of res.data.lines) {
      initial[line.lineIndex] = {
        selected: false,
        quantity: line.refundableQuantity,
        returnToInventory: line.defaultReturnToInventory,
      }
    }
    setLineState(initial)
    setReason("")
    setRefundType("partial")
  }, [orderId])

  React.useEffect(() => {
    if (open && orderId) {
      loadEligibility()
    }
    if (!open) {
      setEligibility(null)
      setLineState({})
    }
  }, [open, orderId, loadEligibility])

  const selectedLines = React.useMemo(() => {
    if (!eligibility) return []
    return eligibility.lines.filter(
      (line) =>
        line.refundableQuantity > 0 &&
        lineState[line.lineIndex]?.selected
    )
  }, [eligibility, lineState])

  const refundAmount = React.useMemo(() => {
    return selectedLines.reduce((sum, line) => {
      const state = lineState[line.lineIndex]
      const qty = Math.min(
        state?.quantity ?? 0,
        line.refundableQuantity
      )
      return sum + line.unitPrice * qty
    }, 0)
  }, [selectedLines, lineState])

  const applyFullRefund = () => {
    if (!eligibility) return
    setRefundType("full")
    const next: Record<number, LineState> = { ...lineState }
    for (const line of eligibility.lines) {
      if (line.refundableQuantity <= 0) continue
      next[line.lineIndex] = {
        selected: true,
        quantity: line.refundableQuantity,
        returnToInventory: next[line.lineIndex]?.returnToInventory ?? false,
      }
    }
    setLineState(next)
  }

  const buildPayloadItems = (): RefundLineInput[] => {
    return selectedLines.map((line) => {
      const state = lineState[line.lineIndex]
      return {
        lineIndex: line.lineIndex,
        quantity: Math.min(state.quantity, line.refundableQuantity),
        returnToInventory: state.returnToInventory,
      }
    })
  }

  const handleSubmit = async () => {
    if (!orderId || !eligibility) return
    if (!reason) {
      toast.error("Буцаалтын шалтгаан сонгоно уу")
      return
    }
    if (selectedLines.length === 0) {
      toast.error("Буцаах бараа сонгоно уу")
      return
    }

    const items = buildPayloadItems()
    const payload: CreateRefundPayload = {
      orderId,
      refundType,
      reason,
      paymentMethod: eligibility.paymentMethod,
      items,
    }

    setSubmitting(true)
    const res = await postApi<
      ApiResponse<{ refundId: string; refundAmount: number }>
    >({
      url: POST_REFUND,
      values: payload,
    })
    setSubmitting(false)

    if (!res?.success) {
      toast.error(res?.message || "Буцаалт амжилтгүй")
      return
    }

    toast.success(`Буцаалт амжилттай: ${formatPrice(res.data?.refundAmount ?? refundAmount)}`)
    onOpenChange(false)
    onSuccess?.()
  }

  const typeBtn = (active: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      active
        ? "bg-green-600 text-white"
        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Буцаалт</DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="py-8 text-center text-sm text-gray-500">
            Ачааллаж байна...
          </p>
        )}

        {!loading && eligibility && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-sm">
              <div>
                <p className="text-gray-500">Захиалгын дугаар</p>
                <p className="font-semibold">#{eligibility.orderNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Ширээ</p>
                <p className="font-semibold">{eligibility.tableName}</p>
              </div>
              <div>
                <p className="text-gray-500">Төлсөн дүн</p>
                <p className="font-semibold">
                  {formatPrice(eligibility.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Төлбөрийн хэлбэр</p>
                <p className="font-semibold">{eligibility.paymentMethod}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={typeBtn(refundType === "full")}
                onClick={applyFullRefund}
              >
                Бүтэн буцаалт
              </button>
              <button
                type="button"
                className={typeBtn(refundType === "partial")}
                onClick={() => setRefundType("partial")}
              >
                Хэсэгчилсэн / тоогоор
              </button>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-800">
                Захиалсан бараа
              </p>
              <div className="space-y-2">
                {eligibility.lines.map((line) => {
                  if (line.refundableQuantity <= 0) return null
                  const state = lineState[line.lineIndex]
                  return (
                    <div
                      key={line.lineIndex}
                      className="rounded-xl border border-gray-200 p-3"
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={state?.selected ?? false}
                          onChange={(e) =>
                            setLineState((prev) => ({
                              ...prev,
                              [line.lineIndex]: {
                                ...prev[line.lineIndex],
                                selected: e.target.checked,
                                quantity:
                                  prev[line.lineIndex]?.quantity ??
                                  line.refundableQuantity,
                                returnToInventory:
                                  prev[line.lineIndex]?.returnToInventory ??
                                  false,
                              },
                            }))
                          }
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {line.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Захиалсан: {line.orderedQuantity} · Буцаагдсан:{" "}
                            {line.refundedQuantity} · Буцаах боломжтой:{" "}
                            {line.refundableQuantity}
                          </p>
                          <p className="text-xs text-gray-500">
                            Нэгж үнэ: {formatPrice(line.unitPrice)}
                          </p>
                        </div>
                      </label>

                      {state?.selected && (
                        <div className="mt-3 flex flex-wrap items-center gap-4 border-t pt-3 pl-7">
                          <label className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Тоо:</span>
                            <input
                              type="number"
                              min={1}
                              max={line.refundableQuantity}
                              value={state.quantity}
                              className="w-20 rounded border px-2 py-1"
                              onChange={(e) => {
                                const qty = Math.min(
                                  line.refundableQuantity,
                                  Math.max(1, Number(e.target.value) || 1)
                                )
                                setLineState((prev) => ({
                                  ...prev,
                                  [line.lineIndex]: {
                                    ...prev[line.lineIndex],
                                    quantity: qty,
                                  },
                                }))
                              }}
                            />
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={state.returnToInventory}
                              onChange={(e) =>
                                setLineState((prev) => ({
                                  ...prev,
                                  [line.lineIndex]: {
                                    ...prev[line.lineIndex],
                                    returnToInventory: e.target.checked,
                                  },
                                }))
                              }
                            />
                            Агуулах руу буцаах
                          </label>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                Буцаалтын шалтгаан
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value as RefundReason)}
              >
                <option value="">Сонгох...</option>
                {(
                  Object.entries(REFUND_REASON_LABELS) as [
                    RefundReason,
                    string,
                  ][]
                ).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Буцаах дүн</span>
                <span className="font-bold text-amber-900">
                  {formatPrice(refundAmount)}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Цэвэр үлдэгдэл (одоо)</span>
                <span>{formatPrice(eligibility.netAmount - refundAmount)}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Цуцлах
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              submitting ||
              loading ||
              !eligibility?.canRefund ||
              selectedLines.length === 0
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? "Буцааж байна..." : "Refund"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

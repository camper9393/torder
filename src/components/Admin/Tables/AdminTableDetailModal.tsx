"use client"



import React from "react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { TableDetail } from "@/types/table"

import { KitchenOrder } from "@/types/kitchenOrder"

import { IMenu } from "@/types/menu"

import {
  CONSUMER_MENU,
  PATCH_KITCHEN_ORDER,
  POST_TABLE_MANUAL_ORDER,
} from "@/utils/APIConstant"

import { ApiResponse } from "@/utils/api"

import { getApi, patchApi, postApi } from "@/utils/common"

import { formatPrice } from "@/utils/currency"

import { formatTableDisplayName } from "@/utils/adminTableDisplay"

import { adminTablePosStyles } from "@/utils/adminTablePosStyles"

import { mergeMenuItemIntoOrder } from "@/utils/mergeOrderMenuItem"
import { normalizeOrderItemsForSave } from "@/utils/orderItemPricing"
import {
  buildCombinedTableBill,
  computeLineItemSubtotal,
  computeOrderTotal,
  computeOrdersTotalWithStoredFallback,
  resolveLineItemQuantity,
} from "@/utils/orderTotals"

import { useLocale } from "@/context/LocaleContext"
import { resolveOrderItemDisplay } from "@/utils/menuBilingual"

import { cn } from "@/lib/utils"

import { Plus, Pencil } from "lucide-react"

import toast from "react-hot-toast"

import BillReceiptModal from "@/components/Kitchen/BillReceiptModal"

import AdminTableMenuPicker, {
  type AdminTablePickerCartLine,
} from "./AdminTableMenuPicker"

import AdminTableOrderItemRow from "./AdminTableOrderItemRow"



type AdminTableDetailModalProps = {

  open: boolean

  detail: TableDetail | null

  merchantId?: string

  restaurantName: string

  closing: boolean

  onClose: () => void

  onCloseTable: () => void

  onOrdersChanged: () => void

}



const NEW_ORDER_DRAFT_ID = "__new__"

function isEditableStatus(status: string): boolean {

  return status === "new" || status === "accepted"

}

const allItemsServedBadgeClass =
  "bg-emerald-50 text-emerald-800 border border-emerald-200"

const allItemsServedDotClass = "bg-emerald-500"

const freeTableDetailBadgeClass =
  "bg-slate-100 text-slate-600 border border-slate-200"

const freeTableDetailDotClass = "bg-slate-400"

function areAllOrderItemsServed(tableOrders: KitchenOrder[]): boolean {
  const items = tableOrders.flatMap((order) => order.items)
  return items.length > 0 && items.every((item) => item.served === true)
}

const DISCOUNT_PRESET_PERCENTS = [5, 10, 20, 30] as const

function parseDiscountPercentInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value < 0 || value > 100) return null
  return value
}



function cloneOrders(source: KitchenOrder[]): KitchenOrder[] {

  return source.map((o) => ({

    ...o,

    items: o.items.map((item) => ({ ...item })),

  }))

}



function AdminTableDetailModal({

  open,

  detail,

  merchantId,

  restaurantName,

  closing,

  onClose,

  onCloseTable,

  onOrdersChanged,

}: AdminTableDetailModalProps) {

  const { t, locale } = useLocale()

  const at = t.adminTables

  const [orders, setOrders] = React.useState<KitchenOrder[]>([])

  const [menuEditMode, setMenuEditMode] = React.useState(false)

  const [draftOrders, setDraftOrders] = React.useState<KitchenOrder[]>([])

  const [menu, setMenu] = React.useState<IMenu[]>([])

  const [pickerOpen, setPickerOpen] = React.useState(false)

  const [pickerOrderId, setPickerOrderId] = React.useState<string | null>(null)

  const [printOrder, setPrintOrder] = React.useState<KitchenOrder | null>(null)

  const [saving, setSaving] = React.useState(false)


  const [markingServedKey, setMarkingServedKey] = React.useState<string | null>(
    null
  )

  const [discountDialogOpen, setDiscountDialogOpen] = React.useState(false)
  const [discountInput, setDiscountInput] = React.useState("")
  const [discountError, setDiscountError] = React.useState<string | null>(null)
  const [appliedDiscountPercent, setAppliedDiscountPercent] = React.useState<
    number | null
  >(null)

  const menuEditModeRef = React.useRef(false)

  const detailTableNameRef = React.useRef<string | null>(null)

  menuEditModeRef.current = menuEditMode



  React.useEffect(() => {

    if (!open) {

      setPrintOrder(null)

      setPickerOpen(false)

      setPickerOrderId(null)

      setMenuEditMode(false)

      setDraftOrders([])

      detailTableNameRef.current = null

      setDiscountDialogOpen(false)

      setDiscountInput("")

      setDiscountError(null)

      setAppliedDiscountPercent(null)

    }

  }, [open])



  React.useEffect(() => {

    if (!detail) {

      detailTableNameRef.current = null

      return

    }



    const tableChanged = detail.tableName !== detailTableNameRef.current

    detailTableNameRef.current = detail.tableName



    if (tableChanged) {

      setMenuEditMode(false)

      setDraftOrders([])

      setOrders(detail.orders)

      setAppliedDiscountPercent(null)

      setDiscountDialogOpen(false)

      setDiscountInput("")

      setDiscountError(null)

      return

    }



    if (!menuEditModeRef.current) {

      setOrders(detail.orders)

    }

  }, [detail])



  React.useEffect(() => {

    if (!open || !merchantId) return



    const loadMenu = async () => {

      const res = await getApi<

        ApiResponse<{ menu: IMenu[]; restaurantName: string }>

      >({

        url: CONSUMER_MENU,

        param: { merchantId: String(merchantId) },

      })

      if (res?.success && res.data && !Array.isArray(res.data)) {

        setMenu(

          res.data.menu.map((m) => ({

            ...m,

            _id: String(m._id),

            merchantId: String(m.merchantId),

          }))

        )

      }

    }



    loadMenu()

  }, [open, merchantId])



  if (!detail) return null



  const pos = adminTablePosStyles[detail.status]

  const tableLabel = formatTableDisplayName(
    detail.tableName,
    t.common.table
  )



  const displayOrders = menuEditMode ? draftOrders : orders

  const allItemsServed = areAllOrderItemsServed(orders)

  let statusBadgeClass = allItemsServed ? allItemsServedBadgeClass : pos.badge

  let statusDotClass = allItemsServed ? allItemsServedDotClass : pos.dot

  let statusBadgeLabel = allItemsServed
    ? locale === "en"
      ? "All items served"
      : "Бүх захиалга өгсөн"
    : pos.badgeLabel

  if (!allItemsServed && detail.status === "free") {
    statusBadgeClass = freeTableDetailBadgeClass
    statusDotClass = freeTableDetailDotClass
  }

  if (!allItemsServed && detail.status === "accepted") {
    statusBadgeLabel =
      locale === "en" ? "Order accepted" : "Захиалга хүлээн авсан"
  }

  const liveTotal = computeOrdersTotalWithStoredFallback(displayOrders)

  const originalTotal = liveTotal

  const discountPercent =
    appliedDiscountPercent != null && appliedDiscountPercent > 0
      ? appliedDiscountPercent
      : null

  const discountAmount =
    discountPercent != null
      ? Math.round((originalTotal * discountPercent) / 100)
      : 0

  const finalTotal = originalTotal - discountAmount

  const canPrint = orders.length > 0

  const openDiscountDialog = () => {
    setDiscountInput(
      appliedDiscountPercent != null ? String(appliedDiscountPercent) : ""
    )
    setDiscountError(null)
    setDiscountDialogOpen(true)
  }

  const handleApplyDiscount = () => {
    const parsed = parseDiscountPercentInput(discountInput)
    if (parsed === null) {
      setDiscountError(
        !discountInput.trim()
          ? "Хувь оруулна уу"
          : "0–100 хооронд зөв тоо оруулна уу"
      )
      return
    }
    setAppliedDiscountPercent(parsed === 0 ? null : parsed)
    setDiscountDialogOpen(false)
    setDiscountError(null)
  }

  const editableOrders = orders.filter((o) => isEditableStatus(o.status))

  const primaryEditableId = editableOrders[0]?._id ?? null

  const draftEditableId =

    draftOrders.find((o) => isEditableStatus(o.status))?._id ?? null



  const patchOrder = async (

    orderId: string,

    payload: {

      items?: KitchenOrder["items"]

      status?: KitchenOrder["status"]

    },

    options?: { refreshParent?: boolean }

  ) => {

    const res = await patchApi<ApiResponse<KitchenOrder>>({

      url: PATCH_KITCHEN_ORDER,

      values: { orderId, ...payload },

    })



    if (!res?.success || !res.data) {

      toast.error(res?.message || at.updateFailed)

      return false

    }



    const updated = res.data

    setOrders((prev) =>

      prev.map((o) => (o._id === orderId ? updated : o))

    )

    if (options?.refreshParent !== false) onOrdersChanged()

    return true

  }



  const markItemServed = async (orderId: string, itemIndex: number) => {

    const key = `${orderId}-${itemIndex}`

    setMarkingServedKey(key)



    const previousOrders = orders

    setOrders((prev) =>

      prev.map((o) => {

        if (o._id !== orderId) return o

        return {

          ...o,

          items: o.items.map((item, i) =>

            i === itemIndex ? { ...item, served: true } : item

          ),

        }

      })

    )



    const res = await patchApi<ApiResponse<KitchenOrder>>({

      url: PATCH_KITCHEN_ORDER,

      values: { orderId, itemIndex, served: true },

    })



    setMarkingServedKey(null)



    if (!res?.success || !res.data) {

      setOrders(previousOrders)

      toast.error(res?.message || at.updateFailed)

      return

    }



    const updated = res.data

    setOrders((prev) =>

      prev.map((o) => (o._id === orderId ? updated : o))

    )

    onOrdersChanged()

  }



  const enterMenuEditMode = () => {

    if (!primaryEditableId) return

    setDraftOrders(cloneOrders(orders))

    setMenuEditMode(true)

  }



  const openAddMenuPicker = () => {

    if (!merchantId) return

    if (orders.length === 0) {

      startCreateOrder()

      return

    }

    if (!primaryEditableId) return

    if (!menuEditMode) {

      setDraftOrders(cloneOrders(orders))

      setMenuEditMode(true)

    }

    setPickerOrderId(primaryEditableId)

    setPickerOpen(true)

  }



  const startCreateOrder = () => {

    if (!detail || orders.length > 0 || !merchantId) return



    const draft: KitchenOrder = {

      _id: NEW_ORDER_DRAFT_ID,

      merchantId: String(merchantId),

      tableName: detail.tableName,

      items: [],

      total: 0,

      status: "accepted",

      createdAt: new Date().toISOString(),

    }



    setDraftOrders([draft])

    setMenuEditMode(true)

    setPickerOrderId(NEW_ORDER_DRAFT_ID)

    setPickerOpen(true)

  }



  const createManualTableOrder = async (

    items: KitchenOrder["items"]

  ): Promise<KitchenOrder | null> => {

    if (!merchantId || !detail) {

      toast.error(at.updateFailed)

      return null

    }



    let sanitized: KitchenOrder["items"]
    try {
      sanitized = normalizeOrderItemsForSave(items)
    } catch {
      toast.error(at.updateFailed)
      return null
    }
    console.log("ORDER ITEMS BEFORE SAVE", sanitized)

    const res = await postApi<ApiResponse<KitchenOrder>>({

      url: POST_TABLE_MANUAL_ORDER,

      values: {

        merchantId: String(merchantId),

        tableName: detail.tableName,

        items: sanitized,

        total: computeOrderTotal(sanitized),

      },

    })



    if (!res?.success || !res.data) {

      toast.error(res?.message || at.updateFailed)

      return null

    }



    return res.data

  }



  const cancelMenuEdit = () => {

    setMenuEditMode(false)

    setDraftOrders([])

    setPickerOpen(false)

    setPickerOrderId(null)

    if (detail) setOrders(detail.orders)

  }



  const saveMenuEdit = async () => {

    const toSave = draftOrders.filter((o) => isEditableStatus(o.status))

    if (toSave.length === 0) {

      cancelMenuEdit()

      return

    }



    for (const order of toSave) {

      if (order.items.length === 0) {

        toast.error(at.updateFailed)

        return

      }

    }



    setSaving(true)

    let ok = true

    for (const order of toSave) {

      if (order._id === NEW_ORDER_DRAFT_ID) {

        const created = await createManualTableOrder(order.items)

        if (!created) {

          ok = false

        } else {

          setOrders([created])

        }

        continue

      }



      const success = await patchOrder(

        order._id,

        { items: order.items },

        { refreshParent: false }

      )

      if (!success) ok = false

    }

    setSaving(false)



    if (!ok) return



    setMenuEditMode(false)

    setDraftOrders([])

    onOrdersChanged()

    toast.success(

      toSave.some((o) => o._id === NEW_ORDER_DRAFT_ID)

        ? at.orderCreated

        : at.changesSaved

    )

  }



  const handlePickerConfirm = (lines: AdminTablePickerCartLine[]) => {
    const orderId =
      pickerOrderId ??
      (menuEditMode ? draftEditableId : null) ??
      primaryEditableId

    if (!orderId || !menuEditMode || lines.length === 0) return

    const order = draftOrders.find((o) => o._id === orderId)
    if (!order || !isEditableStatus(order.status)) return

    let items = order.items
    for (const line of lines) {
      for (let i = 0; i < line.quantity; i++) {
        const next = mergeMenuItemIntoOrder(items, line.menuItem, line.size)
        if (!next) {
          toast.error(at.updateFailed)
          return
        }
        items = next
      }
    }

    setDraftOrders((prev) =>
      prev.map((o) =>
        o._id === orderId
          ? {
              ...o,
              items,
              total: computeOrderTotal(items),
            }
          : o
      )
    )
    setPickerOpen(false)
  }

  const updateDraftItemQuantity = (

    orderId: string,

    itemIndex: number,

    delta: number

  ) => {

    setDraftOrders((prev) =>

      prev.map((order) => {

        if (order._id !== orderId) return order

        const items = [...order.items]

        const item = items[itemIndex]

        if (!item) return order



        const nextQty = item.quantity + delta

        if (nextQty < 1) {

          if (

            delta < 0 &&

            !window.confirm(at.confirmZeroQuantity)

          ) {

            return order

          }

          items.splice(itemIndex, 1)

        } else {

          items[itemIndex] = { ...item, quantity: nextQty }

        }



        return {

          ...order,

          items,

          total: computeOrderTotal(items),

        }

      })

    )

  }



  const removeDraftItem = (orderId: string, itemIndex: number) => {

    if (!window.confirm(at.confirmRemoveItem)) return



    setDraftOrders((prev) =>

      prev.map((order) => {

        if (order._id !== orderId) return order

        const items = order.items.filter((_, i) => i !== itemIndex)

        return {

          ...order,

          items,

          total: computeOrderTotal(items),

        }

      })

    )

  }



  const handlePrintBill = () => {
    const bill = buildCombinedTableBill(displayOrders, detail.tableName)
    if (bill) setPrintOrder(bill)
  }



  return (

    <>

      <BillReceiptModal

        open={printOrder !== null}

        onClose={() => setPrintOrder(null)}

        order={printOrder}

        restaurantName={restaurantName}

        closeTableLabel={at.closeTable}

        confirmCloseTable={at.confirmCloseTable}

        closingTable={closing}

        onCloseTable={async () => {

          setPrintOrder(null)

          await onCloseTable()

        }}

      />



      <AdminTableMenuPicker

        open={pickerOpen}

        menu={menu}

        onClose={() => setPickerOpen(false)}

        onConfirm={handlePickerConfirm}

      />

      <Dialog
        open={discountDialogOpen}
        onOpenChange={(v) => {
          setDiscountDialogOpen(v)
          if (!v) setDiscountError(null)
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="z-[60] max-w-sm gap-0 overflow-hidden rounded-xl p-0 sm:max-w-sm"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <DialogTitle className="text-base font-bold text-slate-900">
              Хөнгөлөлт
            </DialogTitle>
          </div>
          <div className="space-y-2 px-4 py-3">
            <div className="grid grid-cols-4 gap-1.5">
              {DISCOUNT_PRESET_PERCENTS.map((preset) => {
                const parsedInput = parseDiscountPercentInput(discountInput)
                const isActive = parsedInput === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setDiscountInput(String(preset))
                      if (discountError) setDiscountError(null)
                    }}
                    className={cn(
                      "h-8 rounded-md border text-xs font-semibold transition touch-manipulation",
                      isActive
                        ? "border-[#1E5EFF] bg-[#1E5EFF] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-[#1E5EFF]/40 hover:bg-[#1E5EFF]/5"
                    )}
                  >
                    {preset}%
                  </button>
                )
              })}
            </div>
            <label
              htmlFor="table-discount-percent"
              className="text-sm font-medium text-slate-700"
            >
              Хөнгөлөлтийн хувь
            </label>
            <Input
              id="table-discount-percent"
              type="text"
              inputMode="decimal"
              placeholder="Жишээ: 5"
              value={discountInput}
              onChange={(e) => {
                setDiscountInput(e.target.value)
                if (discountError) setDiscountError(null)
              }}
              className="h-10"
            />
            {discountError ? (
              <p className="text-xs text-red-600">{discountError}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-lg"
              onClick={() => {
                setDiscountDialogOpen(false)
                setDiscountError(null)
              }}
            >
              Цуцлах
            </Button>
            <Button
              type="button"
              className="h-10 rounded-lg bg-[#1E5EFF] font-semibold text-white hover:bg-[#1548D4]"
              onClick={handleApplyDiscount}
            >
              Хэрэглэх
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>

        <DialogContent

          centered

          showCloseButton={false}

          className="flex max-h-[92vh] w-[92vw] max-w-2xl flex-col overflow-hidden rounded-2xl border-slate-200 bg-white shadow-xl sm:max-w-3xl"

        >

          <div className="shrink-0 border-b border-slate-100 px-4 py-2.5">
            <DialogTitle className="text-lg font-bold leading-tight text-slate-900">
              {tableLabel}
            </DialogTitle>

            {!menuEditMode && primaryEditableId && displayOrders.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={openAddMenuPicker}
                  className="h-8 rounded-lg border-[#1E5EFF]/40 bg-[#1E5EFF]/5 px-2.5 text-xs font-semibold text-[#1E5EFF] hover:bg-[#1E5EFF]/10 touch-manipulation"
                >
                  <Plus className="mr-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {at.addNewMenu}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={enterMenuEditMode}
                  className="h-8 rounded-lg border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 touch-manipulation"
                >
                  <Pencil className="mr-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {at.editMenu}
                </Button>
              </div>
            ) : null}
          </div>



          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">

            {displayOrders.length === 0 ? (

              <div className="flex flex-col items-center gap-5 py-10">

                <p className="text-center text-lg text-slate-500">{at.noOrder}</p>

                <Button

                  type="button"

                  disabled={saving || !merchantId}

                  onClick={startCreateOrder}

                  className="min-h-[56px] h-auto w-full max-w-sm rounded-xl border-2 border-dashed border-[#1E5EFF]/50 bg-[#1E5EFF]/5 px-6 py-4 text-xl font-bold text-[#1E5EFF] hover:bg-[#1E5EFF]/10 touch-manipulation"

                >

                  {at.addOrder}

                </Button>

              </div>

            ) : (

              <div className="space-y-1.5">

                {displayOrders.map((order) => (

                  <div

                    key={order._id}

                    className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50/40"

                  >

                    {displayOrders.length > 1 && (

                      <p className="border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">

                        #{order._id.slice(-6)}

                      </p>

                    )}

                    <ul className="divide-y divide-slate-100">

                      {order.items.map((item, idx) => {
                        const { name, sizeLabel } = resolveOrderItemDisplay(
                          item,
                          locale
                        )
                        return (
                        <AdminTableOrderItemRow

                          key={`${order._id}-${idx}`}

                          name={name}

                          portionLabel={sizeLabel}

                          image={item.image}

                          quantity={resolveLineItemQuantity(item)}

                          lineSubtotal={computeLineItemSubtotal(item)}

                          served={item.served === true}

                          showServedButton={!menuEditMode}

                          servedBadgeLabel={at.itemServedBadge}

                          markServedLabel={at.markItemServed}

                          itemServedDoneLabel={at.itemServedDone}

                          markingServed={

                            markingServedKey === `${order._id}-${idx}`

                          }

                          onMarkServed={() => markItemServed(order._id, idx)}

                          readOnly={!menuEditMode}

                          disabled={saving}

                          removeLabel={at.removeItem}

                          onDecrease={

                            menuEditMode && isEditableStatus(order.status)

                              ? () =>

                                  updateDraftItemQuantity(

                                    order._id,

                                    idx,

                                    -1

                                  )

                              : undefined

                          }

                          onIncrease={

                            menuEditMode && isEditableStatus(order.status)

                              ? () =>

                                  updateDraftItemQuantity(

                                    order._id,

                                    idx,

                                    1

                                  )

                              : undefined

                          }

                          onRemove={

                            menuEditMode && isEditableStatus(order.status)

                              ? () => removeDraftItem(order._id, idx)

                              : undefined

                          }

                        />

                        )
                      })}
                    </ul>

                  </div>

                ))}

              </div>

            )}

          </div>



          <div className="shrink-0 space-y-3 border-t border-slate-100 bg-slate-50/95 px-5 py-4 backdrop-blur-sm">

            <div className="space-y-1">

              <p className="flex justify-between text-lg font-bold text-slate-900">

                <span>{at.totalLabel}:</span>

                <span>{formatPrice(originalTotal)}</span>

              </p>

              {discountPercent != null ? (
                <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm text-slate-600">

                  <span>Хөнгөлөлт: {discountPercent}%</span>

                  <span className="font-semibold text-red-600 tabular-nums">
                    (-{formatPrice(discountAmount)})
                  </span>

                </p>
              ) : null}

              {discountPercent != null ? (
                <p className="flex justify-between text-lg font-bold text-slate-900">

                  <span>Төлөх дүн:</span>

                  <span className="text-[#1E5EFF]">
                    {formatPrice(finalTotal)}
                  </span>

                </p>
              ) : null}

            </div>

            <p className="flex flex-wrap items-center gap-2">

              <span className="text-sm text-slate-500">{at.statusLabel}:</span>

              <span

                className={cn(

                  "inline-flex min-h-9 max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold leading-tight sm:min-h-10 sm:px-4 sm:text-sm",

                  statusBadgeClass

                )}

              >

                <span

                  className={cn("h-2 w-2 shrink-0 rounded-full", statusDotClass)}

                  aria-hidden

                />

                {statusBadgeLabel}

              </span>

            </p>



            <div className="flex flex-col gap-2.5 pt-1">

              {menuEditMode && (primaryEditableId || pickerOrderId === NEW_ORDER_DRAFT_ID) && (

                <div className="grid grid-cols-2 gap-2">

                  <Button

                    type="button"

                    variant="outline"

                    disabled={saving}

                    onClick={cancelMenuEdit}

                    className="min-h-[52px] h-auto rounded-xl py-3.5 text-lg border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 touch-manipulation"

                  >

                    {at.cancelEdit}

                  </Button>

                  <Button

                    type="button"

                    disabled={saving}

                    onClick={saveMenuEdit}

                    className="min-h-[52px] h-auto rounded-xl py-3.5 text-lg bg-[#1E5EFF] font-semibold text-white hover:bg-[#1548D4] touch-manipulation"

                  >

                    {at.saveChanges}

                  </Button>

                </div>

              )}



              {!menuEditMode && (

                <div className="space-y-2">

                  <div className="grid grid-cols-2 gap-2">

                    <Button

                      type="button"

                      variant="outline"

                      disabled={saving}

                      onClick={openDiscountDialog}

                      className="h-9 rounded-lg border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 hover:bg-slate-50 touch-manipulation"

                    >

                      Хөнгөлөлт

                    </Button>

                    <Button

                      type="button"

                      variant="outline"

                      disabled={saving}

                      onClick={() => console.log("[table-detail] promotion placeholder")}

                      className="h-9 rounded-lg border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 hover:bg-slate-50 touch-manipulation"

                    >

                      Урамшуулал

                    </Button>

                  </div>

                  <div className="grid grid-cols-2 gap-2">

                    <Button

                      type="button"

                      disabled={!canPrint || saving}

                      onClick={handlePrintBill}

                      className="min-h-[52px] h-auto rounded-xl py-3.5 text-lg bg-[#1E5EFF] font-semibold text-white hover:bg-[#1548D4] disabled:opacity-40 touch-manipulation"

                    >

                      {at.printBill}

                    </Button>

                    <Button

                      type="button"

                      variant="destructive"

                      disabled={saving}

                      onClick={onClose}

                      className="min-h-[52px] h-auto rounded-xl py-3.5 text-lg font-semibold touch-manipulation"

                    >

                      Буцах

                    </Button>

                  </div>

                </div>

              )}

            </div>

          </div>

        </DialogContent>

      </Dialog>

    </>

  )

}



export default AdminTableDetailModal


import { TableSummary } from "@/types/table"



/** POS / floor plan table card color state */

export type TableCardVisualState =

  | "empty"

  | "waiter_called"

  | "new"

  | "accepted_pending"

  | "paid"



export function getTableCardVisualState(

  table: TableSummary

): TableCardVisualState {

  const itemCount = table.itemCount ?? 0

  const pendingQty = table.pendingQuantityCount ?? 0



  if (table.waiterCalled || table.hasWaiterCalledOrder) {

    return "waiter_called"

  }



  if (table.status === "free" || itemCount === 0) {

    return "empty"

  }



  if (table.status === "new" || (table.newOrderIds?.length ?? 0) > 0) {

    return "new"

  }



  if (table.isPaid) {

    return "paid"

  }



  if (

    (table.status === "accepted" ||

      table.status === "cooking" ||

      table.status === "waiting_bill") &&

    pendingQty > 0

  ) {

    return "accepted_pending"

  }



  if (pendingQty === 0 && itemCount > 0) {

    return "paid"

  }



  return "empty"

}



export const tableCardVisualStyles: Record<

  TableCardVisualState,

  {

    card: string

    statusPill: string

    elapsed: string

  }

> = {

  empty: {

    card: "border border-slate-300 bg-white text-slate-900 shadow-sm",

    statusPill: "bg-slate-500 text-white",

    elapsed: "text-slate-500",

  },

  waiter_called: {

    card: "border-2 border-red-500 bg-red-50 text-slate-900 shadow-sm",

    statusPill: "bg-red-600 text-white",

    elapsed: "text-red-700",

  },

  new: {

    card: "border-2 border-blue-500 bg-blue-50 text-slate-900 shadow-sm",

    statusPill: "bg-blue-600 text-white",

    elapsed: "text-blue-700",

  },

  accepted_pending: {

    card: "border-2 border-orange-400 bg-amber-50 text-slate-900 shadow-sm",

    statusPill: "bg-orange-500 text-white",

    elapsed: "text-orange-700",

  },

  paid: {

    card: "border-2 border-emerald-500 bg-emerald-50 text-slate-900 shadow-sm",

    statusPill: "bg-emerald-600 text-white",

    elapsed: "text-emerald-700",

  },

}



/** Optimistic UI when a single preview line is marked served */

export function applyOptimisticItemServed(

  table: TableSummary,

  orderId: string,

  itemIndex: number

): TableSummary | null {

  const pending = table.pendingPreviewItems ?? []

  const matchIdx = pending.findIndex(

    (i) => i.orderId === orderId && i.itemIndex === itemIndex

  )

  if (matchIdx < 0) return null



  const item = { ...pending[matchIdx], served: true as const }

  const nextPending = pending.filter((_, i) => i !== matchIdx)

  const nextServed = [...(table.servedPreviewItems ?? []), item]

  const pendingQty = Math.max(

    0,

    (table.pendingQuantityCount ?? 0) - item.quantity

  )



  return {

    ...table,

    pendingPreviewItems: nextPending,

    servedPreviewItems: nextServed,

    pendingQuantityCount: pendingQty,

    morePendingCount: Math.max(0, (table.morePendingCount ?? 0)),

  }

}



export function buildTicketItemList(table: TableSummary) {

  const pending = table.pendingPreviewItems ?? []

  const served = table.servedPreviewItems ?? []

  return [

    ...pending.map((item) => ({ ...item, served: false as const })),

    ...served.map((item) => ({ ...item, served: true as const })),

  ]

}



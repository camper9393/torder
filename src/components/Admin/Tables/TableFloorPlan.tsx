"use client"



import React from "react"

import { TableSummary } from "@/types/table"

import type { FloorLayoutTable } from "@/types/floorLayout"

import { isTakeoutTableName } from "@/utils/tableFloorPlan"

import { cn } from "@/lib/utils"

import { FloorPlanTableSlot } from "@/components/Admin/FloorLayout/FloorPlanTableSlot"
import AdminTableCard from "./AdminTableCard"

import { useLocale } from "@/context/LocaleContext"



type TableFloorPlanProps = {

  tables: TableSummary[]

  layouts: Record<string, FloorLayoutTable>

  onOpenTable: (tableName: string) => void

  markingServedKey: string | null

  acceptingTable: string | null

  onAcceptNewOrders: (tableName: string, orderIds: string[]) => void

  onMarkItemServed: (

    tableName: string,

    orderId: string,

    itemIndex: number

  ) => void

  className?: string

}



export function TableStatusLegendTooltip() {
  const { t } = useLocale()
  const legend = t.adminTables.floorPlanLegend

  const items = [
    { swatch: "bg-white ring-1 ring-slate-300", label: legend.empty },
    { swatch: "bg-red-50 ring-2 ring-red-500", label: legend.waiter },
    { swatch: "bg-blue-50 ring-2 ring-blue-500", label: legend.new },
    { swatch: "bg-amber-50 ring-2 ring-orange-400", label: legend.accepted },
    { swatch: "bg-emerald-50 ring-2 ring-emerald-500", label: legend.paid },
  ]

  return (
    <div role="list" aria-label={legend.title} className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-900">{legend.title}</p>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 text-xs text-slate-700"
          role="listitem"
        >
          <span
            className={cn("h-3 w-3 shrink-0 rounded-full", item.swatch)}
            aria-hidden
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function TableFloorPlan({

  tables,

  layouts,

  onOpenTable,

  markingServedKey,

  acceptingTable,

  onAcceptNewOrders,

  onMarkItemServed,

  className,

}: TableFloorPlanProps) {

  const { t } = useLocale()

  const at = t.adminTables



  return (

    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>

      <div

        className={cn(

          "relative min-h-0 flex-1 w-full",

          "bg-[linear-gradient(180deg,#ebe6dc_0%,#e2dcd0_100%)]",

          "ring-1 ring-inset ring-stone-300/60"

        )}

      >

        {tables.some((tbl) => isTakeoutTableName(tbl.tableName)) && (

          <span className="pointer-events-none absolute right-4 top-4 z-[1] text-xs font-semibold uppercase tracking-wide text-amber-900/75">

            {at.takeoutZone}

          </span>

        )}



        {tables.map((table) => {

          const layoutId = table.layout?.id

          const layout =

            table.layout ??

            layouts[table.tableName] ??

            (layoutId ? layouts[layoutId] : undefined)

          if (!layout) return null



          return (

            <FloorPlanTableSlot
              key={layoutId ?? table.tableName}
              layout={layout}
            >
              <AdminTableCard
                table={table}
                floorPlanMode
                markingServedKey={markingServedKey}
                acceptingNewOrders={acceptingTable === table.tableName}
                onAcceptNewOrders={() =>
                  onAcceptNewOrders(table.tableName, table.newOrderIds)
                }
                onMarkItemServed={(orderId, itemIndex) =>
                  onMarkItemServed(table.tableName, orderId, itemIndex)
                }
                onOpen={() => onOpenTable(table.tableName)}
              />
            </FloorPlanTableSlot>

          )

        })}

      </div>

    </div>

  )

}



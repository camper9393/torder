"use client"



import type { FloorLayoutTable } from "@/types/floorLayout"

import { DEFAULT_TABLE_COLOR } from "@/utils/floorLayout"

import { cn } from "@/lib/utils"

import { FloorPlanTableSlot } from "./FloorPlanTableSlot"



type FloorLayoutTableShapeProps = {

  table: FloorLayoutTable

  selected: boolean

  onSelect: () => void

  onPointerDownDrag: (e: React.PointerEvent) => void

}



export function FloorLayoutTableShape({

  table,

  selected,

  onSelect,

  onPointerDownDrag,

}: FloorLayoutTableShapeProps) {
  const isCircle = table.shape === "circle"
  const displayName = (table.displayLabel ?? table.tableName).trim()

  return (
    <FloorPlanTableSlot layout={table} zIndex={selected ? "z-30" : "z-10"}>

      <div

        role="button"

        tabIndex={0}

        onClick={(e) => {

          e.stopPropagation()

          onSelect()

        }}

        onPointerDown={(e) => {

          if (e.button !== 0) return

          onSelect()

          onPointerDownDrag(e)

        }}

        className={cn(

          "flex h-full w-full cursor-grab touch-none select-none flex-col items-center justify-center overflow-hidden px-1 text-center text-sm font-semibold text-white shadow-md active:cursor-grabbing",

          isCircle ? "rounded-[9999px]" : "rounded-md",

          selected &&

            "ring-2 ring-white ring-offset-2 ring-offset-[#4A7FE5]"

        )}

        style={{ backgroundColor: DEFAULT_TABLE_COLOR }}

      >

        <span className="max-w-full truncate">{displayName}</span>

        {table.description && table.description !== table.tableName && (

          <span className="mt-0.5 max-w-full truncate text-[10px] font-normal opacity-90">

            {table.description}

          </span>

        )}

      </div>

    </FloorPlanTableSlot>

  )

}



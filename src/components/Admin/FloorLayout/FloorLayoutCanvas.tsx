"use client"

import React from "react"
import type { FloorLayoutTable } from "@/types/floorLayout"
import {
  clampFloorLayoutTable,
  normalizeCircleDimensions,
  normalizeShape,
} from "@/utils/floorLayout"
import { cn } from "@/lib/utils"
import { defaultHall } from "@/utils/tableHalls"
import { FloorLayoutTableShape } from "./FloorLayoutTableShape"
import { HallSelectorBar } from "./HallSelectorBar"
import type { TableHall } from "@/types/floorLayout"

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

type FloorLayoutCanvasProps = {
  tables: FloorLayoutTable[]
  selectedId: string | null
  onSelect: (tableId: string | null) => void
  onChange: (tables: FloorLayoutTable[]) => void
  halls: TableHall[]
  selectedHallId: string
  onSelectHall: (hallId: string) => void
  onAddHall?: () => void
  addHallLabel?: string
  emptyHallMessage?: string
}

type DragState = {
  tableId: string
  startClientX: number
  startClientY: number
  startX: number
  startY: number
}

type ResizeState = {
  tableId: string
  handle: ResizeHandle
  startClientX: number
  startClientY: number
  start: FloorLayoutTable
}

const HANDLE_CLASS =
  "absolute z-40 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#1E5EFF] shadow touch-none"

export function FloorLayoutCanvas({
  tables,
  selectedId,
  onSelect,
  onChange,
  halls,
  selectedHallId,
  onSelectHall,
  onAddHall,
  addHallLabel,
  emptyHallMessage,
}: FloorLayoutCanvasProps) {
  const displayHalls = halls.length > 0 ? halls : [defaultHall()]
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const [resize, setResize] = React.useState<ResizeState | null>(null)

  const patchTable = React.useCallback(
    (tableId: string, patch: Partial<FloorLayoutTable>) => {
      onChange(
        tables.map((t) =>
          t.id === tableId ? clampFloorLayoutTable({ ...t, ...patch }) : t
        )
      )
    },
    [onChange, tables]
  )

  const clientToPercent = React.useCallback(
    (clientX: number, clientY: number) => {
      const el = canvasRef.current
      if (!el) return { x: 0, y: 0 }
      const rect = el.getBoundingClientRect()
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      }
    },
    []
  )

  React.useEffect(() => {
    if (!drag && !resize) return

    const onMove = (e: PointerEvent) => {
      if (drag) {
        const now = clientToPercent(e.clientX, e.clientY)
        const start = clientToPercent(drag.startClientX, drag.startClientY)
        patchTable(drag.tableId, {
          x: drag.startX + (now.x - start.x),
          y: drag.startY + (now.y - start.y),
        })
      }

      if (resize) {
        const el = canvasRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        const dx = ((e.clientX - resize.startClientX) / rect.width) * 100
        const dy = ((e.clientY - resize.startClientY) / rect.height) * 100
        const s = resize.start
        let { x, y, width, height } = s

        switch (resize.handle) {
          case "se":
            width = s.width + dx
            height = s.height + dy
            break
          case "e":
            width = s.width + dx
            break
          case "s":
            height = s.height + dy
            break
          case "sw":
            x = s.x + dx
            width = s.width - dx
            height = s.height + dy
            break
          case "w":
            x = s.x + dx
            width = s.width - dx
            break
          case "n":
            y = s.y + dy
            height = s.height - dy
            break
          case "ne":
            y = s.y + dy
            width = s.width + dx
            height = s.height - dy
            break
          case "nw":
            x = s.x + dx
            y = s.y + dy
            width = s.width - dx
            height = s.height - dy
            break
        }

        const table = tables.find((t) => t.id === resize.tableId)
        if (table && normalizeShape(table.shape) === "circle") {
          ;({ width, height } = normalizeCircleDimensions(width, height))
          if (resize.handle === "nw" || resize.handle === "w" || resize.handle === "sw") {
            x = s.x + s.width - width
          }
          if (resize.handle === "nw" || resize.handle === "n" || resize.handle === "ne") {
            y = s.y + s.height - height
          }
        }

        patchTable(resize.tableId, { x, y, width, height })
      }
    }

    const onUp = () => {
      setDrag(null)
      setResize(null)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [clientToPercent, drag, patchTable, resize, tables])

  const startResize = (
    tableId: string,
    handle: ResizeHandle,
    e: React.PointerEvent
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const table = tables.find((t) => t.id === tableId)
    if (!table) return
    setDrag(null)
    setResize({
      tableId,
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      start: table,
    })
  }

  const selected = tables.find((t) => t.id === selectedId)

  const handlePositions = selected
    ? (() => {
        const t = selected
        const isCircle = normalizeShape(t.shape) === "circle"
        const cx = (x: number) => `${t.x + x * t.width}%`
        const cy = (y: number) => `${t.y + y * t.height}%`
        const corners = [
          { handle: "nw" as const, left: cx(0), top: cy(0) },
          { handle: "ne" as const, left: cx(1), top: cy(0) },
          { handle: "se" as const, left: cx(1), top: cy(1) },
          { handle: "sw" as const, left: cx(0), top: cy(1) },
        ]
        if (isCircle) return corners
        return [
          ...corners,
          { handle: "n" as const, left: cx(0.5), top: cy(0) },
          { handle: "e" as const, left: cx(1), top: cy(0.5) },
          { handle: "s" as const, left: cx(0.5), top: cy(1) },
          { handle: "w" as const, left: cx(0), top: cy(0.5) },
        ]
      })()
    : []

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <HallSelectorBar
        variant="bar"
        halls={displayHalls}
        selectedHallId={selectedHallId}
        onSelect={onSelectHall}
        onAddHall={onAddHall}
        addHallLabel={addHallLabel}
      />
      <div
        ref={canvasRef}
        className={cn(
          "relative min-h-0 flex-1 overflow-hidden bg-white",
          "bg-[linear-gradient(to_right,#e8eaed_1px,transparent_1px),linear-gradient(to_bottom,#e8eaed_1px,transparent_1px)]",
          "[background-size:24px_24px]"
        )}
        onClick={() => onSelect(null)}
      >
      {tables.length === 0 && emptyHallMessage ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
          {emptyHallMessage}
        </div>
      ) : null}

      {tables.map((table) => (
        <FloorLayoutTableShape
          key={table.id}
          table={table}
          selected={table.id === selectedId}
          onSelect={() => onSelect(table.id)}
          onPointerDownDrag={(e) => {
            e.stopPropagation()
            setResize(null)
            setDrag({
              tableId: table.id,
              startClientX: e.clientX,
              startClientY: e.clientY,
              startX: table.x,
              startY: table.y,
            })
          }}
        />
      ))}

      {handlePositions.map(({ handle, left, top }) => (
        <div
          key={handle}
          role="presentation"
          className={cn(HANDLE_CLASS, "cursor-pointer")}
          style={{
            left,
            top,
            transform: "translate(-50%, -50%)",
          }}
          onPointerDown={(e) => startResize(selected!.id, handle, e)}
        />
      ))}
      </div>
    </div>
  )
}

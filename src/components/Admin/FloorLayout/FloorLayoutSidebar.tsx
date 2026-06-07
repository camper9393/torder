"use client"

import React from "react"
import type { FloorLayoutTable, TableShape } from "@/types/floorLayout"
import {
  clampFloorLayoutTable,
  dimensionsToSizeSlider,
  FLOOR_LAYOUT_SLIDER_MIN,
  normalizeCircleDimensions,
  sizeSliderToDimensions,
} from "@/utils/floorLayout"
import { cn } from "@/lib/utils"
import { HallDeleteButton } from "./HallDeleteButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Circle, RectangleHorizontal, Trash2 } from "lucide-react"

type FloorLayoutSidebarProps = {
  selected: FloorLayoutTable | null
  onUpdateSelected: (
    patch: Partial<FloorLayoutTable>,
    options?: { validateName?: boolean }
  ) => boolean
  onAddTable: (shape: TableShape) => void
  onDeleteTable: () => void
  onDeleteHall?: () => void
  canDeleteHall?: boolean
  labels: {
    addTable: string
    hallSettings: string
    deleteHall: string
    tableSettings: string
    name: string
    description: string
    size: string
    shape: string
    deleteTable: string
    selectTableHint: string
    rectangle: string
    circle: string
  }
}

function ShapeButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-14 flex-1 items-center justify-center rounded-lg border-2 transition-colors touch-manipulation",
        active
          ? "border-[#4A7FE5] bg-[#4A7FE5]/10 text-[#4A7FE5]"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
    >
      {children}
    </button>
  )
}

export function FloorLayoutSidebar({
  selected,
  onUpdateSelected,
  onAddTable,
  onDeleteTable,
  onDeleteHall,
  canDeleteHall = false,
  labels,
}: FloorLayoutSidebarProps) {
  const [nameDraft, setNameDraft] = React.useState("")
  const lastValidNameRef = React.useRef("")

  React.useEffect(() => {
    const name = selected?.tableName ?? ""
    setNameDraft(name)
    lastValidNameRef.current = name
  }, [selected?.id, selected?.tableName])

  const sizeValue = selected
    ? dimensionsToSizeSlider(selected.shape, selected.width, selected.height)
    : 50

  const applyShape = (shape: TableShape) => {
    if (!selected) return
    let { width, height } = selected
    if (shape === "circle") {
      ;({ width, height } = normalizeCircleDimensions(width, height))
    }
    onUpdateSelected(
      clampFloorLayoutTable({ ...selected, shape, width, height })
    )
  }

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <h2 className="mb-3 text-sm font-bold text-slate-800">{labels.addTable}</h2>
        <div className="flex gap-2">
          <ShapeButton
            label={labels.rectangle}
            active={false}
            onClick={() => onAddTable("rectangle")}
          >
            <RectangleHorizontal className="h-7 w-7 stroke-[1.5]" />
          </ShapeButton>
          <ShapeButton
            label={labels.circle}
            active={false}
            onClick={() => onAddTable("circle")}
          >
            <Circle className="h-7 w-7 stroke-[1.5]" />
          </ShapeButton>
        </div>
      </div>

      {canDeleteHall && onDeleteHall ? (
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-bold text-slate-800">
            {labels.hallSettings}
          </h2>
          <HallDeleteButton
            onClick={onDeleteHall}
            label={labels.deleteHall}
            className="mt-3 w-full justify-center"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <h2 className="text-sm font-bold text-slate-800">{labels.tableSettings}</h2>

        {!selected && (
          <p className="text-sm text-slate-500">{labels.selectTableHint}</p>
        )}

        {selected && (
          <>
            <div className="space-y-1.5">
              <label htmlFor="fl-name" className="text-sm font-medium">
                {labels.name}
              </label>
              <Input
                id="fl-name"
                value={nameDraft}
                onChange={(e) => {
                  const value = e.target.value
                  setNameDraft(value)
                  onUpdateSelected({ tableName: value }, { validateName: false })
                }}
                onBlur={() => {
                  if (!selected) return
                  const trimmed = nameDraft.trim()
                  if (trimmed === selected.tableName.trim()) return

                  const ok = onUpdateSelected(
                    { tableName: nameDraft },
                    { validateName: true }
                  )
                  if (!ok) {
                    setNameDraft(lastValidNameRef.current)
                    onUpdateSelected(
                      { tableName: lastValidNameRef.current },
                      { validateName: false }
                    )
                    return
                  }

                  lastValidNameRef.current = trimmed
                  setNameDraft(trimmed)
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="fl-desc" className="text-sm font-medium">
                {labels.description}
              </label>
              <Input
                id="fl-desc"
                value={selected.description}
                onChange={(e) =>
                  onUpdateSelected({ description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {labels.size}: {sizeValue}
              </label>
              <input
                type="range"
                min={FLOOR_LAYOUT_SLIDER_MIN}
                max={100}
                step={1}
                value={sizeValue}
                onChange={(e) => {
                  const dims = sizeSliderToDimensions(
                    selected.shape,
                    Number(e.target.value)
                  )
                  if (selected.shape === "circle") {
                    const side = dims.width
                    onUpdateSelected({ width: side, height: side })
                  } else {
                    onUpdateSelected(dims)
                  }
                }}
                className="h-2 w-full cursor-pointer accent-[#4A7FE5]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{labels.shape}</label>
              <div className="flex gap-2">
                <ShapeButton
                  label={labels.rectangle}
                  active={selected.shape === "rectangle"}
                  onClick={() => applyShape("rectangle")}
                >
                  <RectangleHorizontal className="h-6 w-6" />
                </ShapeButton>
                <ShapeButton
                  label={labels.circle}
                  active={selected.shape === "circle"}
                  onClick={() => applyShape("circle")}
                >
                  <Circle className="h-6 w-6" />
                </ShapeButton>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-auto w-full border-red-200 text-red-600 hover:bg-red-50"
              onClick={onDeleteTable}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {labels.deleteTable}
            </Button>
          </>
        )}
      </div>
    </aside>
  )
}

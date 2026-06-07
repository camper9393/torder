"use client"

import React from "react"
import { GripVertical, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCategoryLucideIcon } from "@/utils/categoryIcons"
import { patchApi } from "@/utils/common"
import { MENU_ORDER } from "@/utils/APIConstant"
import { MENU_ITEM_DRAG_MIME } from "./menuItemSection"

export { mergeSectionOrder } from "@/utils/menuOrder"

export type MenuSectionEntry = {
  key: string
  label: string
  icon?: string
}

type MenuSectionSidebarProps = {
  sections: MenuSectionEntry[]
  activeSection: string
  onSelect: (key: string) => void
  onEdit?: (key: string) => void
  onReorder: (keys: string[]) => void
  onItemDrop?: (itemId: string, targetSection: string) => void
  itemDropHighlight?: string | null
  className?: string
}

function reorderLabels(labels: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= labels.length || to >= labels.length) {
    return labels
  }
  const next = [...labels]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

function categoryCardClass(active: boolean, extras?: string) {
  return cn(
    "group flex items-center gap-1.5 rounded-xl border px-2 py-2.5 transition-all",
    active
      ? "border-green-600 bg-green-600 text-white shadow-md shadow-green-600/25"
      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-sm",
    extras
  )
}

function setCardDragPreview(e: React.DragEvent, cardEl: HTMLElement) {
  const rect = cardEl.getBoundingClientRect()
  const clone = cardEl.cloneNode(true) as HTMLElement
  clone.style.width = `${rect.width}px`
  clone.style.position = "fixed"
  clone.style.top = "-9999px"
  clone.style.left = "-9999px"
  clone.style.pointerEvents = "none"
  clone.style.opacity = "1"
  clone.style.boxShadow = "0 10px 28px rgba(15, 23, 42, 0.18)"
  clone.style.transform = "rotate(-1deg)"
  clone.setAttribute("data-drag-preview", "true")
  document.body.appendChild(clone)

  const offsetX = e.clientX - rect.left
  const offsetY = e.clientY - rect.top
  e.dataTransfer.setDragImage(clone, offsetX, offsetY)
  e.dataTransfer.effectAllowed = "move"
}

function clearDragPreviews() {
  document.querySelectorAll("[data-drag-preview]").forEach((node) => node.remove())
}

export function MenuSectionSidebar({
  sections,
  activeSection,
  onSelect,
  onEdit,
  onReorder,
  onItemDrop,
  itemDropHighlight,
  className,
}: MenuSectionSidebarProps) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null)
  const [overIndex, setOverIndex] = React.useState<number | null>(null)
  const [itemDropOver, setItemDropOver] = React.useState<string | null>(null)
  const skipClickRef = React.useRef(false)

  React.useEffect(() => {
    const clearItemDrop = () => setItemDropOver(null)
    document.addEventListener("dragend", clearItemDrop)
    return () => document.removeEventListener("dragend", clearItemDrop)
  }, [])

  const keys = sections.map((s) => s.key)

  const finishDrag = (from: number, to: number) => {
    if (from !== to) {
      skipClickRef.current = true
      onReorder(reorderLabels(keys, from, to))
      window.setTimeout(() => {
        skipClickRef.current = false
      }, 0)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        <ul className="flex flex-col gap-2 p-0.5 pb-1" role="list">
          {sections.map((section, index) => {
            const active = section.key === activeSection
            const dragging = dragIndex === index
            const dropTarget =
              overIndex === index && dragIndex !== null && dragIndex !== index
            const itemDropTarget =
              itemDropOver === section.key ||
              itemDropHighlight === section.key
            const SectionIcon = getCategoryLucideIcon(section.icon)

            return (
              <li key={section.key} className="relative">
                <div
                  ref={(node) => {
                    if (node) node.dataset.sectionCard = section.key
                  }}
                  data-item-drop-target={section.key}
                  className={cn(
                    "relative",
                    categoryCardClass(active),
                    dragging && "scale-[0.98] opacity-35",
                    dropTarget &&
                      !active &&
                      "border-green-400 bg-green-50 ring-2 ring-green-200",
                    itemDropTarget &&
                      "border-green-500 bg-green-50 ring-2 ring-green-400 shadow-md"
                  )}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes(MENU_ITEM_DRAG_MIME)) {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                      setItemDropOver(section.key)
                      return
                    }
                    e.preventDefault()
                    if (dragIndex !== null && dragIndex !== index) {
                      setOverIndex(index)
                    }
                  }}
                  onDragLeave={() => {
                    if (overIndex === index) setOverIndex(null)
                    if (itemDropOver === section.key) setItemDropOver(null)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const itemId = e.dataTransfer.getData(MENU_ITEM_DRAG_MIME)
                    if (itemId && onItemDrop) {
                      setItemDropOver(null)
                      onItemDrop(itemId, section.key)
                      return
                    }
                    if (dragIndex !== null) finishDrag(dragIndex, index)
                  }}
                >
                  <button
                    type="button"
                    draggable
                    aria-label={`${section.label} зөөх`}
                    className={cn(
                      "flex shrink-0 touch-none cursor-grab items-center justify-center rounded-md p-1 active:cursor-grabbing",
                      active
                        ? "text-white/80 hover:bg-white/15"
                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    )}
                    onDragStart={(e) => {
                      const card = e.currentTarget.closest(
                        "[data-section-card]"
                      ) as HTMLElement | null
                      if (!card) return
                      setDragIndex(index)
                      e.dataTransfer.setData("text/plain", section.key)
                      setCardDragPreview(e, card)
                    }}
                    onDragEnd={() => {
                      setDragIndex(null)
                      setOverIndex(null)
                      clearDragPreviews()
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-4 w-4" aria-hidden />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (skipClickRef.current) return
                      onSelect(section.key)
                    }}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 truncate text-left text-sm leading-snug",
                      active ? "font-bold" : "font-medium"
                    )}
                  >
                    <SectionIcon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-white" : "text-slate-500"
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{section.label}</span>
                  </button>

                  {onEdit ? (
                    <button
                      type="button"
                      aria-label={`${section.label} засах`}
                      className={cn(
                        "flex shrink-0 items-center justify-center rounded-md p-1 transition",
                        active
                          ? "text-white/80 hover:bg-white/15"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(section.key)
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : null}

                  {itemDropTarget ? (
                    <div
                      className="pointer-events-none absolute -bottom-1 left-2 right-2 flex justify-center"
                      aria-hidden
                    >
                      <span className="rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                        Drop here
                      </span>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export async function saveMenuSectionOrder(labels: string[]) {
  await patchApi({
    url: MENU_ORDER,
    values: { sectionOrder: labels },
  })
}

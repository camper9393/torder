"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { MENU_ITEM_DRAG_MIME } from "./menuItemSection"
import { reorderItemIds } from "./menuItemOrder"
import MenuItemCard from "./MenuItemCard"

export type MenuItemGridEntry = {
  id: string
  image: string
  nameMn: string
  nameEn: string
  descriptionMn?: string
  quantity: number
  price: number
  originalPrice?: number
  spicyLevel: number
}

type MenuItemGridProps = {
  orderedIds: string[]
  itemsById: Map<string, MenuItemGridEntry>
  insertIndex: number | null
  draggingItemId: string | null
  onReorder: (orderedIds: string[]) => void
  onDragStateChange: (draggingId: string | null) => void
  onInsertIndexChange: (index: number | null) => void
  onSpicyLevelChange: (id: string, spicyLevel: number) => void
  onEdit: (id: string) => void
  onTouchDragStart: (itemId: string) => void
  onTouchDragMove: (clientX: number, clientY: number) => void
  onTouchDragEnd: (clientX: number, clientY: number, itemId: string) => void
}

export function MenuItemGrid({
  orderedIds,
  itemsById,
  insertIndex,
  draggingItemId,
  onReorder,
  onDragStateChange,
  onInsertIndexChange,
  onSpicyLevelChange,
  onEdit,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
}: MenuItemGridProps) {
  const computeInsertIndex = (
    itemId: string,
    clientY: number,
    element: HTMLElement
  ) => {
    const index = orderedIds.indexOf(itemId)
    if (index === -1) return null
    const rect = element.getBoundingClientRect()
    const before = clientY < rect.top + rect.height / 2
    return before ? index : index + 1
  }

  const handleDrop = (draggedId: string, at: number) => {
    onInsertIndexChange(null)
    onDragStateChange(null)
    const next = reorderItemIds(orderedIds, draggedId, at)
    if (next.join("|") !== orderedIds.join("|")) onReorder(next)
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {orderedIds.map((id, index) => {
        const item = itemsById.get(id)
        if (!item) return null

        const showInsertBefore =
          insertIndex === index && draggingItemId !== null && draggingItemId !== id

        return (
          <div key={id} className="relative">
            {showInsertBefore ? (
              <div
                className="pointer-events-none absolute -top-3 left-4 right-4 z-20 flex items-center gap-2"
                aria-hidden
              >
                <div className="h-1 flex-1 rounded-full bg-indigo-500 shadow-sm" />
                <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Insert
                </span>
                <div className="h-1 flex-1 rounded-full bg-indigo-500 shadow-sm" />
              </div>
            ) : null}

            <div
              data-item-reorder-slot={id}
              className={cn(
                "relative transition-transform duration-200",
                draggingItemId === id && "z-10"
              )}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes(MENU_ITEM_DRAG_MIME)) return
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
                const at = computeInsertIndex(id, e.clientY, e.currentTarget)
                onInsertIndexChange(at)
              }}
              onDragLeave={() => {
                onInsertIndexChange(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const draggedId = e.dataTransfer.getData(MENU_ITEM_DRAG_MIME)
                if (!draggedId || draggedId === id) return
                const at =
                  computeInsertIndex(id, e.clientY, e.currentTarget) ?? index
                handleDrop(draggedId, at)
              }}
            >
              <MenuItemCard
                menuItemId={item.id}
                image={item.image}
                nameMn={item.nameMn}
                nameEn={item.nameEn}
                descriptionMn={item.descriptionMn}
                price={item.price}
                originalPrice={item.originalPrice}
                quantity={item.quantity}
                spicyLevel={item.spicyLevel}
                onSpicyLevelChange={onSpicyLevelChange}
                onEdit={onEdit}
                onItemDragStart={(itemId) => onDragStateChange(itemId)}
                onItemDragEnd={() => {
                  onDragStateChange(null)
                  onInsertIndexChange(null)
                }}
                onTouchDragStart={onTouchDragStart}
                onTouchDragMove={onTouchDragMove}
                onTouchDragEnd={onTouchDragEnd}
              />
            </div>

            {insertIndex === index + 1 &&
            index === orderedIds.length - 1 &&
            draggingItemId !== null &&
            draggingItemId !== id ? (
              <div
                className="pointer-events-none absolute -bottom-3 left-4 right-4 z-20 flex items-center gap-2"
                aria-hidden
              >
                <div className="h-1 flex-1 rounded-full bg-indigo-500 shadow-sm" />
                <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Insert
                </span>
                <div className="h-1 flex-1 rounded-full bg-indigo-500 shadow-sm" />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

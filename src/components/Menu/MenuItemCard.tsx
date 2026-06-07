"use client"

import React, { useState } from "react"
import Image from "next/image"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { Pencil } from "lucide-react"
import toast from "react-hot-toast"
import { patchApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import { IMenu } from "@/model/menu"
import { UPDATE_MENU_ITEM } from "@/utils/APIConstant"
import { Button } from "@/components/ui/button"
import { SpicyLevelSelector } from "./SpicyLevelSelector"
import { SpicyMenuBadge } from "@/components/MenuInterface/SpicyMenuBadge"
import { clampSpicyLevel, normalizeSpicyLevel } from "@/utils/menuSpicy"
import { isValidMenuItemId } from "@/utils/menuItemId"
import { cn } from "@/lib/utils"
import { MENU_ITEM_DRAG_MIME } from "./menuItemSection"
import { useTouchItemDrag } from "./useTouchItemDrag"

interface MenuItemCardProps {
  menuItemId: string
  image: string
  nameMn: string
  nameEn?: string
  descriptionMn?: string
  quantity: number
  price: number
  originalPrice?: number
  spicyLevel?: number
  spicy?: boolean
  onSpicyLevelChange?: (id: string, spicyLevel: number) => void
  onEdit?: (id: string) => void
  onTouchDragStart?: (itemId: string) => void
  onTouchDragMove?: (clientX: number, clientY: number) => void
  onTouchDragEnd?: (clientX: number, clientY: number, itemId: string) => void
  onItemDragStart?: (itemId: string) => void
  onItemDragEnd?: () => void
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
}

function clearDragPreviews() {
  document.querySelectorAll("[data-drag-preview]").forEach((node) => node.remove())
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  menuItemId,
  image,
  nameMn,
  nameEn,
  descriptionMn,
  price,
  quantity,
  originalPrice,
  spicyLevel: spicyLevelProp,
  spicy: spicyProp,
  onSpicyLevelChange,
  onEdit,
  onTouchDragStart,
  onTouchDragMove,
  onTouchDragEnd,
  onItemDragStart,
  onItemDragEnd,
}) => {
  const { t } = useLocale()
  const [spicyLevel, setSpicyLevel] = useState(() =>
    normalizeSpicyLevel(spicyLevelProp, spicyProp)
  )
  const [updatingSpicy, setUpdatingSpicy] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const touchDrag = useTouchItemDrag(menuItemId, cardRef, {
    onStart: (id) => {
      setIsDragging(true)
      onTouchDragStart?.(id)
    },
    onMove: (x, y) => onTouchDragMove?.(x, y),
    onEnd: (x, y, id) => {
      setIsDragging(false)
      onTouchDragEnd?.(x, y, id)
    },
  })

  React.useEffect(() => {
    setSpicyLevel(normalizeSpicyLevel(spicyLevelProp, spicyProp))
  }, [spicyLevelProp, spicyProp, menuItemId])

  const handleSpicyLevelChange = async (next: number) => {
    if (updatingSpicy) return

    const level = clampSpicyLevel(next)

    if (!isValidMenuItemId(menuItemId)) {
      toast.error("Хоолны ID буруу байна — хуудсыг дахин ачаална уу")
      return
    }

    const prev = spicyLevel
    setSpicyLevel(level)
    setUpdatingSpicy(true)

    try {
      const res = await patchApi<ApiResponse<IMenu>>({
        url: UPDATE_MENU_ITEM,
        values: { id: menuItemId, spicyLevel: level },
      })

      if (!res?.success) {
        setSpicyLevel(prev)
        toast.error(res?.message || "Халууны түвшин шинэчилж чадсангүй")
        return
      }

      const saved = normalizeSpicyLevel(res.data?.spicyLevel, res.data?.spicy)
      setSpicyLevel(saved)
      onSpicyLevelChange?.(menuItemId, saved)
    } catch {
      setSpicyLevel(prev)
      toast.error("Халууны түвшин шинэчилж чадсангүй")
    } finally {
      setUpdatingSpicy(false)
    }
  }

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("button, input, label, [data-no-drag]")) {
          e.preventDefault()
          return
        }
        if (!cardRef.current) return
        setIsDragging(true)
        onItemDragStart?.(menuItemId)
        e.dataTransfer.setData(MENU_ITEM_DRAG_MIME, menuItemId)
        e.dataTransfer.effectAllowed = "move"
        setCardDragPreview(e, cardRef.current)
      }}
      onDragEnd={() => {
        setIsDragging(false)
        onItemDragEnd?.()
        clearDragPreviews()
      }}
      onPointerDown={touchDrag.onPointerDown}
      onPointerMove={touchDrag.onPointerMove}
      onPointerUp={touchDrag.onPointerEnd}
      onPointerCancel={touchDrag.onPointerCancel}
      className={cn(
        "group relative m-5 w-56 cursor-grab touch-manipulation overflow-hidden rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-md transition-all duration-300 hover:shadow-xl active:cursor-grabbing md:w-72",
        isDragging && "scale-95 opacity-50"
      )}
    >
      <div className="relative mx-3 mt-3 h-40 overflow-hidden rounded-xl md:h-64">
        <Image
          src={image}
          alt={nameMn}
          fill
          draggable={false}
          className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <SpicyMenuBadge level={spicyLevel} className="!top-3 !left-3" />
      </div>

      <div className="px-4 pb-4 pt-3">
        <h5 className="truncate text-base font-semibold">{nameMn}</h5>
        {nameEn ? (
          <p className="truncate text-xs text-gray-500">{nameEn}</p>
        ) : null}
        {descriptionMn ? (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
            {descriptionMn}
          </p>
        ) : null}

        <div data-no-drag>
          <SpicyLevelSelector
            value={spicyLevel}
            onChange={handleSpicyLevelChange}
            disabled={updatingSpicy}
            className="mt-2"
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <p className="cursor-pointer text-xs text-gray-500">
            {t.tablet.pcWeight(quantity)}
          </p>
          <span className="text-xl font-bold">{formatPrice(price)}</span>
          {originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {onEdit ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-no-drag
            className="mt-3 w-full"
            onClick={() => onEdit(menuItemId)}
          >
            <Pencil size={14} className="mr-2" />
            Засах
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default MenuItemCard

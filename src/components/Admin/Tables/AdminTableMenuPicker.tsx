"use client"

import React from "react"
import Image from "next/image"
import { ImagePlus, Minus, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IMenu } from "@/types/menu"
import { formatPrice } from "@/utils/currency"
import {
  normalizeMenuDocument,
  resolveSizeLabel,
  type BilingualMenuSize,
} from "@/utils/menuBilingual"
import { useLocale } from "@/context/LocaleContext"
import { cn } from "@/lib/utils"

export type AdminTablePickerCartLine = {
  key: string
  menuItem: IMenu
  size?: BilingualMenuSize
  quantity: number
  unitPrice: number
  title: string
}

type AdminTableMenuPickerProps = {
  open: boolean
  menu: IMenu[]
  onClose: () => void
  onConfirm: (lines: AdminTablePickerCartLine[]) => void
}

function cartLineKey(
  menuItem: IMenu,
  size: BilingualMenuSize | undefined,
  unitPrice: number
) {
  return `${String(menuItem._id)}::${size?.labelMn ?? ""}::${size?.labelEn ?? ""}::${unitPrice}`
}

const qtyControlBtn =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40 touch-manipulation"

const quickAddBtn =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-[#1E5EFF] bg-[#1E5EFF] text-white shadow-sm transition hover:bg-[#1548D4] active:scale-95 touch-manipulation"

function MenuPickerThumbnail({ image, alt }: { image?: string; alt: string }) {
  const src = image?.trim()
  if (!src) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400"
        aria-hidden
      >
        <ImagePlus className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-slate-100">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover object-center"
        sizes="40px"
      />
    </div>
  )
}

function AdminTableMenuPicker({
  open,
  menu,
  onClose,
  onConfirm,
}: AdminTableMenuPickerProps) {
  const { locale, t } = useLocale()
  const at = t.adminTables
  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState(at.allCategories)
  const [cart, setCart] = React.useState<AdminTablePickerCartLine[]>([])

  const categories = React.useMemo(() => {
    const sections = new Set<string>()
    for (const item of menu) {
      if (item.section) sections.add(item.section)
    }
    return [at.allCategories, ...Array.from(sections)]
  }, [menu, at.allCategories])

  React.useEffect(() => {
    if (!open) {
      setSearch("")
      setCategory(at.allCategories)
      setCart([])
    }
  }, [open, at.allCategories])

  const addToCart = React.useCallback(
    (menuItem: IMenu, size?: BilingualMenuSize) => {
      const normalized = normalizeMenuDocument(menuItem)
      const unitPrice = size?.price ?? normalized.price
      const key = cartLineKey(menuItem, size, unitPrice)
      const sizeLabel = size ? resolveSizeLabel(size, locale) : ""
      const title = sizeLabel
        ? `${normalized.title} (${sizeLabel})`
        : normalized.title

      setCart((prev) => {
        const index = prev.findIndex((line) => line.key === key)
        if (index >= 0) {
          const next = [...prev]
          next[index] = {
            ...next[index],
            quantity: next[index].quantity + 1,
          }
          return next
        }
        return [
          ...prev,
          { key, menuItem, size, quantity: 1, unitPrice, title },
        ]
      })
    },
    [locale]
  )

  const adjustCartLine = React.useCallback((key: string, delta: number) => {
    setCart((prev) => {
      const index = prev.findIndex((line) => line.key === key)
      if (index < 0) return prev
      const line = prev[index]
      const nextQty = line.quantity + delta
      if (nextQty < 1) {
        return prev.filter((entry) => entry.key !== key)
      }
      const next = [...prev]
      next[index] = { ...line, quantity: nextQty }
      return next
    })
  }, [])

  const qtyForLine = React.useCallback(
    (menuItem: IMenu, size: BilingualMenuSize | undefined, unitPrice: number) => {
      const key = cartLineKey(menuItem, size, unitPrice)
      return cart.find((line) => line.key === key)?.quantity ?? 0
    },
    [cart]
  )

  const cartTotal = React.useMemo(
    () =>
      cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart]
  )

  const handleConfirm = () => {
    if (cart.length === 0) return
    onConfirm(cart)
    onClose()
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return menu.filter((item) => {
      if (category !== at.allCategories && item.section !== category) {
        return false
      }
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
      )
    })
  }, [menu, search, category, at.allCategories])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        centered
        className="flex h-[85vh] max-h-[88vh] w-[85vw] max-w-[1200px] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[min(1200px,92vw)]"
      >
        <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {at.pickerTitle}
          </DialogTitle>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* LEFT — food list (~70%) */}
          <div className="flex min-w-0 flex-[7] flex-col border-r border-slate-200">
            <div className="shrink-0 space-y-2 border-b border-slate-100 bg-white px-3 py-2.5">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={at.searchMenu}
                className="h-9"
              />
              <div className="flex max-w-full flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium transition",
                      category === cat
                        ? "bg-[#1E5EFF] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  {at.noMenuItems}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {filtered.map((item) => {
                    const normalized = normalizeMenuDocument(item)
                    const sizes = normalized.sizes ?? []
                    const hasMultipleSizes = sizes.length > 1
                    const singleSize =
                      sizes.length === 1 ? sizes[0] : undefined
                    const unitPrice = singleSize?.price ?? normalized.price
                    const inCartQty = qtyForLine(item, singleSize, unitPrice)

                    return (
                      <li key={String(item._id)}>
                        <div
                          className={cn(
                            "rounded-lg border bg-white px-2 py-1.5 transition",
                            inCartQty > 0 ||
                              sizes.some(
                                (s) => qtyForLine(item, s, s.price) > 0
                              )
                              ? "border-[#1E5EFF]/40 bg-[#1E5EFF]/5"
                              : "border-slate-100"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <MenuPickerThumbnail
                              image={item.image}
                              alt={item.title}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {item.title}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {item.section}
                              </p>
                              {!hasMultipleSizes ? (
                                <p className="text-xs font-semibold tabular-nums text-[#1E5EFF]">
                                  {formatPrice(unitPrice)}
                                </p>
                              ) : null}
                            </div>
                            {hasMultipleSizes ? (
                              <div className="flex max-w-[48%] shrink-0 flex-wrap items-center justify-end gap-1">
                                {sizes.map((size, sizeIdx) => {
                                  const label = resolveSizeLabel(size, locale)
                                  const lineQty = qtyForLine(
                                    item,
                                    size,
                                    size.price
                                  )
                                  return (
                                    <button
                                      key={`${size.labelMn}-${size.labelEn}-${sizeIdx}`}
                                      type="button"
                                      onClick={() => addToCart(item, size)}
                                      className={cn(
                                        "shrink-0 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-semibold leading-tight transition touch-manipulation sm:text-[11px]",
                                        lineQty > 0
                                          ? "border-[#1E5EFF] bg-[#1E5EFF] text-white"
                                          : "border-slate-200 bg-slate-50 text-slate-800 hover:border-[#1E5EFF]/50"
                                      )}
                                    >
                                      {label} {formatPrice(size.price)}
                                      {lineQty > 0 ? (
                                        <span className="ml-0.5 tabular-nums">
                                          ×{lineQty}
                                        </span>
                                      ) : null}
                                    </button>
                                  )
                                })}
                              </div>
                            ) : (
                              <button
                                type="button"
                                aria-label={at.pickerIncreaseQty}
                                onClick={() => addToCart(item, singleSize)}
                                className={quickAddBtn}
                              >
                                <Plus className="h-4 w-4" strokeWidth={2.5} />
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT — selected cart (~30%) */}
          <div className="flex min-w-0 flex-[3] flex-col bg-slate-50">
            <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5">
              <p className="text-sm font-bold text-slate-900">
                {at.pickerSelectedTitle}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {cart.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-slate-500">
                  {at.pickerCartEmpty}
                </p>
              ) : (
                <ul className="space-y-1">
                  {cart.map((line) => (
                    <li
                      key={line.key}
                      className="rounded-lg border border-slate-200 bg-white p-2"
                    >
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {line.title}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            aria-label={at.pickerDecreaseQty}
                            onClick={() => adjustCartLine(line.key, -1)}
                            className={qtyControlBtn}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[1.25rem] text-center text-sm font-bold tabular-nums text-slate-900">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={at.pickerIncreaseQty}
                            onClick={() => adjustCartLine(line.key, 1)}
                            className={qtyControlBtn}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={at.pickerDecreaseQty}
                            onClick={() =>
                              adjustCartLine(line.key, -line.quantity)
                            }
                            className="ml-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:scale-95 touch-manipulation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="shrink-0 text-xs font-bold tabular-nums text-[#1E5EFF]">
                          {formatPrice(line.unitPrice * line.quantity)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="shrink-0 space-y-2 border-t border-slate-200 bg-white p-3">
              <p className="text-right text-base font-bold tabular-nums text-slate-900">
                {at.pickerTotal(formatPrice(cartTotal))}
              </p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  disabled={cart.length === 0}
                  className="min-h-10 rounded-lg bg-[#1E5EFF] font-semibold text-white hover:bg-[#1548D4] disabled:opacity-40"
                  onClick={handleConfirm}
                >
                  {at.pickerAddToTable}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-9 rounded-lg text-sm"
                  onClick={onClose}
                >
                  {at.pickerCancel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AdminTableMenuPicker

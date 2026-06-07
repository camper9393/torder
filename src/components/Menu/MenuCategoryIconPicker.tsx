"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CATEGORY_ICON_GROUPS,
  CategoryIconName,
  DEFAULT_CATEGORY_ICON,
  getCategoryLucideIcon,
} from "@/utils/categoryIcons"

const GROUP_MODAL_LABELS: Record<string, string> = {
  restaurant: "Ресторан / Ерөнхий хоол",
  asian: "Ази хоол",
  meat: "Махны ресторан",
  pub: "Паб / Бар",
  cafe: "Кафе",
  bakery: "Бэйкери / Амттан",
  drinks: "Ундаа",
  other: "Бусад",
}

type MenuCategoryIconPickerProps = {
  value: CategoryIconName
  onChange: (icon: CategoryIconName) => void
  className?: string
}

function IconChoiceButton({
  iconName,
  selected,
  onSelect,
}: {
  iconName: CategoryIconName
  selected: boolean
  onSelect: (icon: CategoryIconName) => void
}) {
  const Icon = getCategoryLucideIcon(iconName)

  return (
    <button
      type="button"
      aria-label={iconName}
      aria-pressed={selected}
      onClick={() => onSelect(iconName)}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-lg border transition touch-manipulation",
        selected
          ? "border-green-600 bg-green-50 text-green-700 ring-1 ring-green-600/30"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  )
}

function CategoryIconPickerModal({
  open,
  value,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  value: CategoryIconName
  onOpenChange: (open: boolean) => void
  onSelect: (icon: CategoryIconName) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent centered className="max-w-lg p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <DialogTitle className="text-base font-bold text-slate-900">
            Айкон сонгох
          </DialogTitle>
        </div>

        <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
          {CATEGORY_ICON_GROUPS.filter((group) => group.id !== "other").map(
            (group) => (
              <div key={group.id} className="space-y-2">
                <p className="text-xs font-semibold text-slate-600">
                  {GROUP_MODAL_LABELS[group.id] ?? group.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.icons.map((iconName) => (
                    <IconChoiceButton
                      key={`${group.id}-${iconName}`}
                      iconName={iconName}
                      selected={value === iconName}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MenuCategoryIconPicker({
  value,
  onChange,
  className,
}: MenuCategoryIconPickerProps) {
  const [open, setOpen] = React.useState(false)
  const SelectedIcon = getCategoryLucideIcon(value)

  const openPicker = () => setOpen(true)

  const handleSelect = (icon: CategoryIconName) => {
    onChange(icon)
    setOpen(false)
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <button
          type="button"
          onClick={openPicker}
          aria-label="Сонгогдсон айкон"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white touch-manipulation"
        >
          <SelectedIcon className="h-5 w-5" aria-hidden />
        </button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 text-sm"
          onClick={openPicker}
        >
          Айкон сонгох
        </Button>
      </div>

      <CategoryIconPickerModal
        open={open}
        value={value}
        onOpenChange={setOpen}
        onSelect={handleSelect}
      />
    </>
  )
}

export { DEFAULT_CATEGORY_ICON }

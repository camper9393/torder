"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MenuCategoryIconPicker,
  DEFAULT_CATEGORY_ICON,
} from "./MenuCategoryIconPicker"
import type { CategoryIconName } from "@/utils/categoryIcons"

export type CategoryFormValues = {
  labelMn: string
  labelEn: string
  icon: CategoryIconName
}

type MenuCategoryModalProps = {
  open: boolean
  mode: "create" | "edit"
  initial?: CategoryFormValues
  saving?: boolean
  onClose: () => void
  onSave: (values: CategoryFormValues) => void | Promise<void>
}

export function MenuCategoryModal({
  open,
  mode,
  initial,
  saving = false,
  onClose,
  onSave,
}: MenuCategoryModalProps) {
  const [labelMn, setLabelMn] = React.useState("")
  const [labelEn, setLabelEn] = React.useState("")
  const [icon, setIcon] = React.useState<CategoryIconName>(DEFAULT_CATEGORY_ICON)

  React.useEffect(() => {
    if (!open) return
    setLabelMn(initial?.labelMn ?? "")
    setLabelEn(initial?.labelEn ?? "")
    setIcon(initial?.icon ?? DEFAULT_CATEGORY_ICON)
  }, [open, initial?.labelMn, initial?.labelEn, initial?.icon])

  const handleSave = () => {
    const mn = labelMn.trim()
    const en = labelEn.trim()
    if (!mn) return
    void onSave({ labelMn: mn, labelEn: en || mn, icon })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent centered className="max-w-md gap-0 p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <DialogTitle className="text-base font-bold text-slate-900">
            {mode === "create" ? "Ангилал нэмэх" : "Ангилал засах"}
          </DialogTitle>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Монгол нэр
            </label>
            <Input
              value={labelMn}
              onChange={(e) => setLabelMn(e.target.value)}
              placeholder="Жишээ: Хуурга"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              English name
            </label>
            <Input
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              placeholder="Example: Stews"
              className="h-10"
            />
          </div>

          <MenuCategoryIconPicker value={icon} onChange={setIcon} />
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Болих
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !labelMn.trim()}
          >
            {saving ? "Хадгалж байна..." : "Хадгалах"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { DEFAULT_CATEGORY_ICON }

"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { InventoryItemRow } from "@/types/inventory"
import type { InventoryUnit } from "@/model/inventoryItem"
import { patchApi, postApi } from "@/utils/common"
import {
  PATCH_INVENTORY_ITEM,
  POST_INVENTORY_ITEM,
} from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import toast from "react-hot-toast"

const UNITS: { value: InventoryUnit; label: string }[] = [
  { value: "kg", label: "кг" },
  { value: "gram", label: "грам" },
  { value: "liter", label: "литр" },
  { value: "piece", label: "ширхэг" },
]

type InventoryItemFormModalProps = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  item?: InventoryItemRow | null
}

const EMPTY = {
  name: "",
  category: "",
  unit: "kg" as InventoryUnit,
  currentStock: "0",
  minimumStock: "0",
  unitCost: "0",
  notes: "",
}

export default function InventoryItemFormModal({
  open,
  onClose,
  onSaved,
  item,
}: InventoryItemFormModalProps) {
  const [form, setForm] = useState(EMPTY)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (item) {
      setForm({
        name: item.name,
        category: item.category,
        unit: item.unit,
        currentStock: String(item.currentStock),
        minimumStock: String(item.minimumStock),
        unitCost: String(item.unitCost),
        notes: item.notes ?? "",
      })
    } else {
      setForm(EMPTY)
    }
    setImageFile(null)
  }, [open, item])

  const handleChange = useCallback(
    (key: keyof typeof EMPTY, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.category.trim()) {
      toast.error("Нэр болон ангилал заавал")
      return
    }

    setSaving(true)
    const fd = new FormData()
    fd.append("name", form.name.trim())
    fd.append("category", form.category.trim())
    fd.append("unit", form.unit)
    fd.append("currentStock", form.currentStock)
    fd.append("minimumStock", form.minimumStock)
    fd.append("unitCost", form.unitCost)
    fd.append("notes", form.notes)
    if (imageFile) fd.append("image", imageFile)

    const res = item
      ? await patchApi<ApiResponse<InventoryItemRow>>({
          url: PATCH_INVENTORY_ITEM(item._id),
          values: fd,
        })
      : await postApi<ApiResponse<InventoryItemRow>>({
          url: POST_INVENTORY_ITEM,
          values: fd,
        })

    setSaving(false)

    if (!res?.success) {
      toast.error(res?.message || "Алдаа гарлаа")
      return
    }

    toast.success(item ? "Шинэчлэгдлээ" : "Нэмэгдлээ")
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {item ? "Бараа засах" : "Шинэ бараа нэмэх"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Барааны нэр</label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ангилал</label>
              <Input
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Нэгж</label>
              <Select
                value={form.unit}
                onValueChange={(v) => handleChange("unit", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Одоогийн үлдэгдэл</label>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.currentStock}
                onChange={(e) => handleChange("currentStock", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Доод хэмжээ</label>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.minimumStock}
                onChange={(e) => handleChange("minimumStock", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Нэгжийн өртөг</label>
              <Input
                type="number"
                min={0}
                step="any"
                value={form.unitCost}
                onChange={(e) => handleChange("unitCost", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Зураг</label>
            {item?.image && !imageFile && (
              <div className="relative mb-2 h-20 w-20 overflow-hidden rounded-lg border">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImageFile(e.target.files?.[0] ?? null)
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Тэмдэглэл</label>
            <Input
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Болих
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowDownToLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GET_INVENTORY_ITEMS,
  POST_INVENTORY_STOCK_IN,
} from "@/utils/APIConstant"
import { getApi, postApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import type { InventoryItemRow, PaginatedItemsResponse } from "@/types/inventory"
import { formatInventoryUnit } from "@/utils/inventoryUnits"
import InventoryNav from "./InventoryNav"
import toast from "react-hot-toast"

export default function InventoryStockInPage() {
  const [items, setItems] = useState<InventoryItemRow[]>([])
  const [itemId, setItemId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitCost, setUnitCost] = useState("")
  const [supplier, setSupplier] = useState("")
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(async () => {
    const res = await getApi<ApiResponse<PaginatedItemsResponse>>({
      url: GET_INVENTORY_ITEMS,
      param: { page: 1, limit: 500, sortBy: "name", sortDir: "asc" },
    })
    if (res?.success && res.data) setItems(res.data.items)
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const selected = items.find((i) => i._id === itemId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemId || !quantity || Number(quantity) <= 0) {
      toast.error("Бараа болон тоо хэмжээ заавал")
      return
    }

    setSaving(true)
    const res = await postApi<ApiResponse<{ remainingStock: number }>>({
      url: POST_INVENTORY_STOCK_IN,
      values: {
        inventoryItemId: itemId,
        quantity: Number(quantity),
        unitCost: unitCost ? Number(unitCost) : undefined,
        supplier,
        purchaseDate,
        notes,
      },
    })
    setSaving(false)

    if (!res?.success) {
      toast.error(res?.message || "Алдаа гарлаа")
      return
    }

    toast.success(
      `Орлого бүртгэгдлээ. Үлдэгдэл: ${res.data?.remainingStock ?? "—"}`
    )
    setQuantity("")
    setUnitCost("")
    setSupplier("")
    setNotes("")
    void loadItems()
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] pb-10 dark:bg-slate-950">
      <div className="mb-6 flex items-center gap-3">
        <ArrowDownToLine className="h-8 w-8 text-green-600" aria-hidden />
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-950 dark:text-white">
            Орлого бүртгэх
          </h1>
          <p className="text-sm text-gray-600">Худалдан авалт / орлого</p>
        </div>
      </div>

      <InventoryNav />

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-xl space-y-4 rounded-2xl border bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Агуулахын бараа</label>
          <Select value={itemId} onValueChange={setItemId}>
            <SelectTrigger>
              <SelectValue placeholder="Бараа сонгох" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item._id} value={item._id}>
                  {item.name} ({item.currentStock}{" "}
                  {formatInventoryUnit(item.unit)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Тоо хэмжээ
              {selected && ` (${formatInventoryUnit(selected.unit)})`}
            </label>
            <Input
              type="number"
              min={0}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Нэгжийн өртөг</label>
            <Input
              type="number"
              min={0}
              step="any"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              placeholder={selected ? String(selected.unitCost) : ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Нийлүүлэгч</label>
          <Input
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Худалдан авсан огноо</label>
          <Input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Тэмдэглэл</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Хадгалж байна..." : "Орлого бүртгэх"}
        </Button>
      </form>
    </div>
  )
}

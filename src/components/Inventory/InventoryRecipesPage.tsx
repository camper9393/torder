"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ChefHat, Plus, Pencil, Trash2, Search } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  GET_INVENTORY_ITEMS,
  GET_INVENTORY_RECIPES,
  PUT_INVENTORY_RECIPE,
  DELETE_INVENTORY_RECIPE,
} from "@/utils/APIConstant"
import { deleteApi, getApi, putApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import type {
  InventoryItemRow,
  PaginatedItemsResponse,
  RecipeRow,
} from "@/types/inventory"
import type { InventoryUnit } from "@/model/inventoryItem"
import { formatInventoryUnit } from "@/utils/inventoryUnits"
import InventoryNav from "./InventoryNav"
import toast from "react-hot-toast"

const UNITS: InventoryUnit[] = ["kg", "gram", "liter", "piece"]

type DraftIngredient = {
  inventoryItemId: string
  quantity: string
  unit: InventoryUnit
}

export default function InventoryRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [items, setItems] = useState<InventoryItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<RecipeRow | null>(null)
  const [draft, setDraft] = useState<DraftIngredient[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    const [recipeRes, itemRes] = await Promise.all([
      getApi<ApiResponse<RecipeRow[]>>({
        url: GET_INVENTORY_RECIPES,
        param: { search: debouncedSearch },
      }),
      getApi<ApiResponse<PaginatedItemsResponse>>({
        url: GET_INVENTORY_ITEMS,
        param: { page: 1, limit: 500, sortBy: "name", sortDir: "asc" },
      }),
    ])
    if (recipeRes?.success && recipeRes.data) setRecipes(recipeRes.data)
    if (itemRes?.success && itemRes.data) setItems(itemRes.data.items)
    if (!recipeRes?.success) setLoadError(true)
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => {
    void load()
  }, [load])

  const openEdit = (recipe: RecipeRow) => {
    setEditing(recipe)
    setDraft(
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((ing) => ({
            inventoryItemId: ing.inventoryItemId,
            quantity: String(ing.quantity),
            unit: ing.unit,
          }))
        : [{ inventoryItemId: "", quantity: "", unit: "gram" }]
    )
    setEditOpen(true)
  }

  const addIngredientRow = () => {
    setDraft((prev) => [
      ...prev,
      { inventoryItemId: "", quantity: "", unit: "gram" },
    ])
  }

  const updateDraft = (
    index: number,
    key: keyof DraftIngredient,
    value: string
  ) => {
    setDraft((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    )
  }

  const removeDraftRow = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!editing) return
    const ingredients = draft
      .filter((row) => row.inventoryItemId && Number(row.quantity) > 0)
      .map((row) => ({
        inventoryItemId: row.inventoryItemId,
        quantity: Number(row.quantity),
        unit: row.unit,
      }))

    setSaving(true)
    const res = await putApi<ApiResponse<unknown>>({
      url: PUT_INVENTORY_RECIPE(editing.menuItemId),
      values: { ingredients },
    })
    setSaving(false)

    if (!res?.success) {
      toast.error(res?.message || "Алдаа гарлаа")
      return
    }

    toast.success("Жор хадгалагдлаа")
    setEditOpen(false)
    void load()
  }

  const handleClearRecipe = async (recipe: RecipeRow) => {
    if (!confirm(`"${recipe.menuItemName}" жорыг устгах уу?`)) return
    const res = await deleteApi<ApiResponse<unknown>>({
      url: DELETE_INVENTORY_RECIPE(recipe.menuItemId),
    })
    if (!res?.success) {
      toast.error(res?.message || "Алдаа гарлаа")
      return
    }
    toast.success("Жор устгагдлаа")
    void load()
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] pb-10 dark:bg-slate-950">
      <div className="mb-6 flex items-center gap-3">
        <ChefHat className="h-8 w-8 text-green-600" aria-hidden />
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-950 dark:text-white">
            Жорын удирдлага
          </h1>
          <p className="text-sm text-gray-600">Цэсийн бүтээгдэхүүний орц</p>
        </div>
      </div>

      <InventoryNav />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Ачааллаж байна...</div>
      ) : loadError ? (
        <div className="py-16 text-center text-gray-500">
          Жор ачаалахад алдаа гарлаа. Дахин оролдоно уу.
        </div>
      ) : recipes.length === 0 ? (
        <div className="py-16 text-center text-gray-500">Цэсийн бүтээгдэхүүн олдсонгүй</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.menuItemId}
              className="rounded-2xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {recipe.menuItemImage ? (
                    <Image
                      src={recipe.menuItemImage}
                      alt={recipe.menuItemName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ChefHat className="m-3 h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {recipe.menuItemName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {recipe.ingredients.length} орц
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEdit(recipe)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {recipe.ingredients.length > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => void handleClearRecipe(recipe)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
              {recipe.ingredients.length > 0 ? (
                <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {recipe.ingredients.map((ing) => (
                    <li key={ing.inventoryItemId}>
                      • {ing.itemName} — {ing.quantity}{" "}
                      {formatInventoryUnit(ing.unit)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">Орц тодорхойлоогүй</p>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={(v) => !v && setEditOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing?.menuItemName} — орц засах
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {draft.map((row, index) => (
              <div key={index} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[140px] flex-1 space-y-1">
                  <label className="text-xs text-gray-500">Орц</label>
                  <Select
                    value={row.inventoryItemId}
                    onValueChange={(v) =>
                      updateDraft(index, "inventoryItemId", v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Сонгох" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item._id} value={item._id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-xs text-gray-500">Хэмжээ</label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={row.quantity}
                    onChange={(e) =>
                      updateDraft(index, "quantity", e.target.value)
                    }
                  />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-xs text-gray-500">Нэгж</label>
                  <Select
                    value={row.unit}
                    onValueChange={(v) => updateDraft(index, "unit", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {formatInventoryUnit(u)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeDraftRow(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIngredientRow}
            >
              <Plus className="mr-1 h-4 w-4" />
              Орц нэмэх
            </Button>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Болих
              </Button>
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? "Хадгалж байна..." : "Хадгалах"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

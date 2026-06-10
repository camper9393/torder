"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Package, Plus, Search, Pencil, Trash2, ArrowUpDown } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GET_INVENTORY_ITEMS, DELETE_INVENTORY_ITEM } from "@/utils/APIConstant"
import { deleteApi, getApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import type {
  InventoryItemRow,
  PaginatedItemsResponse,
} from "@/types/inventory"
import { formatPrice } from "@/utils/currency"
import { formatInventoryUnit } from "@/utils/inventoryUnits"
import InventoryNav from "./InventoryNav"
import InventoryStatusBadge from "./InventoryStatusBadge"
import InventoryItemFormModal from "./InventoryItemFormModal"
import toast from "react-hot-toast"

type SortField = "name" | "category" | "currentStock" | "unitCost"

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItemRow[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState<SortField>("name")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<InventoryItemRow | null>(null)

  const limit = 15

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    const res = await getApi<ApiResponse<PaginatedItemsResponse>>({
      url: GET_INVENTORY_ITEMS,
      param: {
        page,
        limit,
        search: debouncedSearch,
        category,
        sortBy,
        sortDir,
      },
    })
    if (res?.success && res.data) {
      setItems(res.data.items)
      setTotal(res.data.total)
      setCategories(res.data.categories)
    } else {
      setLoadError(true)
    }
    setLoading(false)
  }, [page, debouncedSearch, category, sortBy, sortDir])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total]
  )

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(field)
      setSortDir("asc")
    }
    setPage(1)
  }

  const handleDelete = async (item: InventoryItemRow) => {
    if (!confirm(`"${item.name}" устгах уу?`)) return
    const res = await deleteApi<ApiResponse<unknown>>({
      url: DELETE_INVENTORY_ITEM(item._id),
    })
    if (!res?.success) {
      toast.error(res?.message || "Устгахад алдаа гарлаа")
      return
    }
    toast.success("Устгагдлаа")
    void loadItems()
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] pb-10 dark:bg-slate-950">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-green-600" aria-hidden />
          <div>
            <h1 className="font-serif text-2xl font-bold text-slate-950 dark:text-white">
              Барааны жагсаалт
            </h1>
            <p className="text-sm text-gray-600">Агуулахын бүх бараа</p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Бараа нэмэх
        </Button>
      </div>

      <InventoryNav />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Хайх..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ангилал" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх ангилал</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Ачааллаж байна...</div>
        ) : loadError ? (
          <div className="py-16 text-center text-gray-500">
            Бараа ачаалахад алдаа гарлаа. Дахин оролдоно уу.
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            Бараа олдсонгүй. Шинэ бараа нэмнэ үү.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Зураг</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => toggleSort("name")}
                  >
                    Нэр <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => toggleSort("category")}
                  >
                    Ангилал <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => toggleSort("currentStock")}
                  >
                    Үлдэгдэл <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Нэгж</TableHead>
                <TableHead>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() => toggleSort("unitCost")}
                  >
                    Өртөг <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead>Нийт үнэ</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead className="text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-slate-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Package className="m-2 h-6 w-6 text-slate-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.currentStock}</TableCell>
                  <TableCell>{formatInventoryUnit(item.unit)}</TableCell>
                  <TableCell>{formatPrice(item.unitCost)}</TableCell>
                  <TableCell>{formatPrice(item.totalValue)}</TableCell>
                  <TableCell>
                    <InventoryStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditing(item)
                          setModalOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => void handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Нийт {total} бараа
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Өмнөх
            </Button>
            <span className="flex items-center px-2 text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Дараах
            </Button>
          </div>
        </div>
      )}

      <InventoryItemFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => void loadItems()}
        item={editing}
      />
    </div>
  )
}

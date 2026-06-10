"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { History, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { GET_INVENTORY_TRANSACTIONS } from "@/utils/APIConstant"
import { getApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import type { PaginatedTransactionsResponse } from "@/types/inventory"
import type { InventoryTransactionType } from "@/model/inventoryTransaction"
import { formatInventoryUnit } from "@/utils/inventoryUnits"
import InventoryNav from "./InventoryNav"
import { useLocale } from "@/context/LocaleContext"

const TYPE_LABELS: Record<InventoryTransactionType, string> = {
  stock_in: "Орлого",
  usage: "Зарцуулалт",
  manual_adjustment: "Гараар тохируулсан",
  refund_return: "Буцаалтаар орсон",
}

export default function InventoryHistoryPage() {
  const { dateLocale } = useLocale()
  const [transactions, setTransactions] = useState<
    PaginatedTransactionsResponse["transactions"]
  >([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [type, setType] = useState("all")

  const limit = 20

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    const res = await getApi<ApiResponse<PaginatedTransactionsResponse>>({
      url: GET_INVENTORY_TRANSACTIONS,
      param: { page, limit, search: debouncedSearch, type },
    })
    if (res?.success && res.data) {
      setTransactions(res.data.transactions)
      setTotal(res.data.total)
    } else {
      setLoadError(true)
    }
    setLoading(false)
  }, [page, debouncedSearch, type])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / limit)),
    [total]
  )

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(dateLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  return (
    <div className="min-h-screen bg-[#F8F5F0] pb-10 dark:bg-slate-950">
      <div className="mb-6 flex items-center gap-3">
        <History className="h-8 w-8 text-green-600" aria-hidden />
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-950 dark:text-white">
            Гүйлгээний түүх
          </h1>
          <p className="text-sm text-gray-600">Бүх агуулахын хөдөлгөөн</p>
        </div>
      </div>

      <InventoryNav />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Бараа хайх..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={type}
          onValueChange={(v) => {
            setType(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Төрөл" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Бүх төрөл</SelectItem>
            <SelectItem value="stock_in">Орлого</SelectItem>
            <SelectItem value="usage">Зарцуулалт</SelectItem>
            <SelectItem value="manual_adjustment">Гараар тохируулсан</SelectItem>
            <SelectItem value="refund_return">Буцаалтаар орсон</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="py-16 text-center text-gray-500">Ачааллаж байна...</div>
        ) : loadError ? (
          <div className="py-16 text-center text-gray-500">
            Гүйлгээ ачаалахад алдаа гарлаа. Дахин оролдоно уу.
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            Гүйлгээ олдсонгүй
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Огноо</TableHead>
                <TableHead>Бараа</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Тоо</TableHead>
                <TableHead>Үлдэгдэл</TableHead>
                <TableHead>Хэрэглэгч</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDate(tx.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">{tx.itemName}</TableCell>
                  <TableCell>{TYPE_LABELS[tx.type]}</TableCell>
                  <TableCell>
                    {tx.quantity > 0 ? "+" : ""}
                    {tx.quantity} {formatInventoryUnit(tx.unit)}
                  </TableCell>
                  <TableCell>
                    {tx.remainingStock} {formatInventoryUnit(tx.unit)}
                  </TableCell>
                  <TableCell>{tx.userName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">Нийт {total} гүйлгээ</p>
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
    </div>
  )
}

"use client"

import React from "react"
import { Tablet } from "lucide-react"
import toast from "react-hot-toast"
import { useAppSelector } from "@/hook/redux"
import { GET_TABLES } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi } from "@/utils/common"
import { parseAdminTablesPayload } from "@/utils/adminTablesPayload"
import type { TableHall } from "@/types/floorLayout"
import type { TableSummary } from "@/types/table"
import { AppUrl } from "@/utils/constants"
import { buildConsumerMenuUrl } from "@/utils/table"
import TabletOrderTableCard from "./TabletOrderTableCard"

export default function AdminTabletOrderPage() {
  const merchantId = useAppSelector((state) => state.merchant).merchant?._id
  const merchantKey = merchantId ? String(merchantId) : undefined

  const [tables, setTables] = React.useState<TableSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState(false)
  const [origin, setOrigin] = React.useState(() => AppUrl.replace(/\/$/, ""))

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin)
    }
  }, [])

  const fetchTables = React.useCallback(async () => {
    if (!merchantKey) {
      setLoading(false)
      setTables([])
      return
    }

    setLoading(true)
    setLoadError(false)

    try {
      const res = await getApi<
        ApiResponse<TableSummary[] | { halls: TableHall[]; tables: TableSummary[] }>
      >({
        url: GET_TABLES,
        param: { merchantId: merchantKey },
      })

      if (res?.success) {
        const payload = parseAdminTablesPayload(res.data)
        setTables(payload.tables)
      } else {
        setLoadError(true)
        setTables([])
      }
    } catch {
      setLoadError(true)
      setTables([])
      toast.error("Tablet order холбоос ачаалж чадсангүй")
    } finally {
      setLoading(false)
    }
  }, [merchantKey])

  React.useEffect(() => {
    void fetchTables()
  }, [fetchTables])

  if (!merchantKey) {
    return (
      <div className="min-h-screen bg-[#F8F5F0]">
        <div className="mx-auto max-w-lg rounded-2xl border bg-white p-10 text-center shadow-sm">
          <Tablet className="mx-auto mb-4 h-12 w-12 text-gray-400" aria-hidden />
          <p className="text-lg text-gray-600">Нэвтэрнэ үү</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Tablet className="h-8 w-8 text-green-600" aria-hidden />
            <div>
              <h1 className="font-serif text-3xl font-bold text-slate-950">
                Tablet order
              </h1>
              <p className="text-sm text-gray-600">
                Ширээ бүрийн таблет захиалгын QR болон холбоос
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <p className="text-center text-gray-500">Ачааллаж байна...</p>
        )}

        {!loading && loadError && (
          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-12 text-center text-amber-900">
            Tablet order холбоос ачаалж чадсангүй
          </div>
        )}

        {!loading && !loadError && tables.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            Ширээ бүртгэгдээгүй байна
          </div>
        )}

        {!loading && !loadError && tables.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {tables.map((table, index) => {
              const link = buildConsumerMenuUrl(
                merchantKey,
                table.tableName,
                origin
              )
              const domId = `tablet-order-qr-${index}`
              return (
                <TabletOrderTableCard
                  key={`${table.tableName}-${index}`}
                  tableName={table.tableName}
                  menuLink={link}
                  domId={domId}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

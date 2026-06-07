"use client"

import React from "react"
import { usePolling } from "@/hooks/usePolling"
import {
  CONSUMER_MENU,
  GET_TABLE_DETAIL,
  GET_TABLES,
  POST_CLOSE_TABLE,
} from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { getApi, postApi } from "@/utils/common"
import { TableDetail, TableSummary } from "@/types/table"
import { LayoutGrid } from "lucide-react"
import toast from "react-hot-toast"
import TableCard from "./TableCard"
import TableDetailModal from "./TableDetailModal"
import { parseAdminTablesPayload } from "@/utils/adminTablesPayload"
import { useLocale } from "@/context/LocaleContext"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"
import SidebarMenuToggle from "@/components/layout/SidebarMenuToggle"

type ConsumerMenuPayload = {
  menu: unknown[]
  restaurantName: string
}

function TablesPage() {
  const [tables, setTables] = React.useState<TableSummary[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null)
  const [detail, setDetail] = React.useState<TableDetail | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [closing, setClosing] = React.useState(false)
  const { t } = useLocale()
  const tbl = t.tables
  const [restaurantName, setRestaurantName] = React.useState("")

  const fetchInFlightRef = React.useRef(false)
  const hasLoadedRef = React.useRef(false)

  const fetchTables = React.useCallback(async (options?: { silent?: boolean }) => {
    if (fetchInFlightRef.current) return
    fetchInFlightRef.current = true

    if (!options?.silent && !hasLoadedRef.current) {
      setLoading(true)
    }

    try {
      const res = await getApi<
        ApiResponse<
          TableSummary[] | { halls: unknown[]; tables: TableSummary[] }
        >
      >({
        url: GET_TABLES,
      })

      if (res?.success && res.data) {
        setTables(parseAdminTablesPayload(res.data).tables)
        hasLoadedRef.current = true
      }
    } finally {
      fetchInFlightRef.current = false
      setLoading(false)
    }
  }, [])

  const loadDetail = React.useCallback(async (tableName: string) => {
    const res = await getApi<ApiResponse<TableDetail>>({
      url: `${GET_TABLE_DETAIL}?tableName=${encodeURIComponent(tableName)}`,
    })

    if (!res?.success || !res.data) {
      toast.error(res?.message || tbl.couldNotLoad)
      return
    }

    setDetail(res.data)
    setDetailOpen(true)

    const merchantId = res.data.orders.find((o) => o.merchantId)?.merchantId
    if (merchantId) {
      const menuRes = await getApi<ApiResponse<ConsumerMenuPayload | unknown[]>>({
        url: `${CONSUMER_MENU}?merchantId=${merchantId}`,
      })
      if (menuRes?.success && menuRes.data && !Array.isArray(menuRes.data)) {
        setRestaurantName(menuRes.data.restaurantName ?? t.common.restaurant)
      }
    }
  }, [tbl.couldNotLoad, t.common.restaurant])

  usePolling(
    () => {
      void fetchTables({ silent: hasLoadedRef.current })
    },
    5000,
    true
  )

  usePolling(
    () => {
      if (selectedTable) void loadDetail(selectedTable)
    },
    5000,
    detailOpen && Boolean(selectedTable)
  )

  const handleOpenTable = (tableName: string) => {
    setSelectedTable(tableName)
    loadDetail(tableName)
  }

  const handleCloseModal = () => {
    setDetailOpen(false)
    setSelectedTable(null)
    setDetail(null)
  }

  const handleCloseTable = async () => {
    if (!selectedTable) return

    setClosing(true)
    const merchantId = detail?.orders.find((o) => o.merchantId)?.merchantId

    const res = await postApi<ApiResponse<{ modifiedCount: number }>>({
      url: POST_CLOSE_TABLE,
      values: {
        tableName: selectedTable,
        ...(merchantId ? { merchantId } : {}),
      },
    })

    setClosing(false)

    if (!res?.success) {
      toast.error(res?.message || tbl.couldNotClose)
      return
    }

    toast.success(tbl.tableClosed)
    handleCloseModal()
    fetchTables()
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <SidebarMenuToggle />
            <LayoutGrid className="h-8 w-8 text-green-600" aria-hidden />
            <div>
              <h1 className="font-serif text-3xl font-bold text-slate-950">
                {tbl.title}
              </h1>
              <p className="text-sm text-gray-600">{tbl.subtitle}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        <p className="mb-8 text-sm text-gray-600">{tbl.refreshNote}</p>

        {loading && (
          <p className="text-center text-gray-500">{tbl.loading}</p>
        )}

        {!loading && tables.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            {tbl.empty}
          </div>
        )}

        {!loading && tables.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables.map((table) => (
              <TableCard
                key={table.tableName}
                table={table}
                onClick={() => handleOpenTable(table.tableName)}
              />
            ))}
          </div>
        )}
      </div>

      <TableDetailModal
        open={detailOpen}
        detail={detail}
        restaurantName={restaurantName || t.common.restaurant}
        closing={closing}
        onClose={handleCloseModal}
        onCloseTable={handleCloseTable}
      />
    </div>
  )
}

export default TablesPage

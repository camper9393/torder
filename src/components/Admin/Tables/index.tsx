"use client"

import React from "react"
import {
  CONSUMER_MENU,
  GET_TABLE_DETAIL,
  GET_TABLES,
  PATCH_KITCHEN_ORDER,
  PATCH_WAITER_CALL,
  POST_CLOSE_TABLE,
  POST_TABLE_HALL,
  DELETE_TABLE_HALL,
} from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { deleteApi, getApi, patchApi, postApi } from "@/utils/common"
import type { FloorLayoutTable, FloorLayoutPayload, TableHall } from "@/types/floorLayout"
import { clampFloorLayoutTable, filterTablesByHall } from "@/utils/floorLayout"
import { parseAdminTablesPayload } from "@/utils/adminTablesPayload"
import { DEFAULT_HALL_ID, defaultHall } from "@/utils/tableHalls"
import { KitchenOrder } from "@/types/kitchenOrder"
import { TableDetail, TableSummary } from "@/types/table"
import { applyOptimisticItemServed, getTableCardVisualState } from "@/utils/adminTableCardVisual"
import { TableDisplayStatus } from "@/utils/tableManagement"
import { HelpCircle, LayoutGrid, Map, Volume2 } from "lucide-react"
import toast from "react-hot-toast"
import { FloorLayoutModal } from "@/components/Admin/FloorLayout/FloorLayoutModal"
import { useLocale } from "@/context/LocaleContext"
import { useAppSelector } from "@/hook/redux"
import { useKitchenDing } from "@/hooks/useKitchenDing"
import { useAdminTableNewOrderSound } from "@/hooks/useAdminTableNewOrderSound"
import { useAdminTableWaiterCallSound } from "@/hooks/useAdminTableWaiterCallSound"
import { usePolling } from "@/hooks/usePolling"
import { TableFloorPlan, TableStatusLegendTooltip } from "./TableFloorPlan"
import { HallSelectorBar } from "@/components/Admin/FloorLayout/HallSelectorBar"
import AdminTableDetailModal from "./AdminTableDetailModal"
import SidebarMenuToggle from "@/components/layout/SidebarMenuToggle"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function normalizeSummary(row: TableSummary): TableSummary {
  const pending = row.pendingPreviewItems ?? row.previewItems ?? []
  const served = row.servedPreviewItems ?? []
  return {
    ...row,
    layout: row.layout ? clampFloorLayoutTable(row.layout) : undefined,
    itemCount: row.itemCount ?? 0,
    previewItems: row.previewItems ?? pending,
    morePreviewCount: row.morePreviewCount ?? 0,
    pendingPreviewItems: pending,
    servedPreviewItems: served,
    morePendingCount: row.morePendingCount ?? 0,
    moreServedCount: row.moreServedCount ?? 0,
    pendingQuantityCount: row.pendingQuantityCount ?? 0,
    newOrderIds: row.newOrderIds ?? [],
    waiterCalled: row.waiterCalled ?? false,
    waiterCallId: row.waiterCallId,
  }
}

function AdminTablesPage() {
  const [tables, setTables] = React.useState<TableSummary[]>([])
  const [layouts, setLayouts] = React.useState<
    Record<string, FloorLayoutTable>
  >({})
  const [loading, setLoading] = React.useState(true)
  const [selectedTable, setSelectedTable] = React.useState<string | null>(null)
  const [detail, setDetail] = React.useState<TableDetail | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [closing, setClosing] = React.useState(false)
  const [restaurantName, setRestaurantName] = React.useState("")
  const [markingServedKey, setMarkingServedKey] = React.useState<string | null>(
    null
  )
  const [acceptingTable, setAcceptingTable] = React.useState<string | null>(
    null
  )
  const [floorLayoutOpen, setFloorLayoutOpen] = React.useState(false)
  const [halls, setHalls] = React.useState<TableHall[]>([defaultHall()])
  const [selectedHallId, setSelectedHallId] = React.useState(DEFAULT_HALL_ID)
  const [addingHall, setAddingHall] = React.useState(false)
  const [deletingHall, setDeletingHall] = React.useState(false)
  const { t } = useLocale()
  const tbl = t.tables
  const at = t.adminTables
  const fl = t.floorLayout
  const merchantId = useAppSelector((state) => state.merchant).merchant?._id
  const merchantKey = merchantId ? String(merchantId) : undefined

  const { soundEnabled, playDing, enableSound } = useKitchenDing()

  const fetchInFlightRef = React.useRef(false)
  const hasLoadedRef = React.useRef(false)
  const syncLayoutsFromTables = React.useCallback((rows: TableSummary[]) => {
    const list =
      rows
        .map((row) => row.layout)
        .filter((l): l is FloorLayoutTable => Boolean(l)) ?? []
    if (list.length > 0) {
      const map: Record<string, FloorLayoutTable> = {}
      for (const layout of list) {
        const clamped = clampFloorLayoutTable(layout)
        map[clamped.tableName] = clamped
        const layoutId = clamped.id
        if (layoutId) map[layoutId] = clamped
      }
      setLayouts(map)
    }
  }, [])

  const fetchTables = React.useCallback(
    async (options?: { silent?: boolean }) => {
      if (fetchInFlightRef.current) return
      fetchInFlightRef.current = true

      if (!options?.silent && !hasLoadedRef.current) {
        setLoading(true)
      }

      try {
        const res = await getApi<
          ApiResponse<
            | TableSummary[]
            | { halls: TableHall[]; tables: TableSummary[] }
          >
        >({
          url: GET_TABLES,
          ...(merchantKey ? { param: { merchantId: merchantKey } } : {}),
        })

        if (res?.success && res.data) {
          const payload = parseAdminTablesPayload(res.data)
          const normalized = payload.tables.map(normalizeSummary)
          setHalls(payload.halls)
          setSelectedHallId((prev) =>
            payload.halls.some((hall) => hall.id === prev)
              ? prev
              : payload.halls[0]?.id ?? DEFAULT_HALL_ID
          )
          setTables(normalized)
          syncLayoutsFromTables(normalized)
          hasLoadedRef.current = true
        }
      } finally {
        fetchInFlightRef.current = false
        setLoading(false)
      }
    },
    [merchantKey, syncLayoutsFromTables]
  )

  const allNewOrderIds = React.useMemo(
    () => [...new Set(tables.flatMap((tbl) => tbl.newOrderIds))],
    [tables]
  )

  useAdminTableNewOrderSound(
    merchantKey,
    allNewOrderIds,
    playDing,
    soundEnabled
  )

  const activeWaiterCallIds = React.useMemo(
    () =>
      tables
        .filter((tbl) => tbl.waiterCalled && tbl.waiterCallId)
        .map((tbl) => String(tbl.waiterCallId)),
    [tables]
  )

  useAdminTableWaiterCallSound(
    merchantKey,
    activeWaiterCallIds,
    playDing,
    soundEnabled
  )

  const loadDetailInFlightRef = React.useRef(false)

  const loadDetail = React.useCallback(
    async (tableName: string, options?: { silent?: boolean }) => {
      if (loadDetailInFlightRef.current) return
      loadDetailInFlightRef.current = true

      try {
        const res = await getApi<ApiResponse<TableDetail>>({
          url: GET_TABLE_DETAIL,
          param: {
            tableName,
            ...(merchantKey ? { merchantId: merchantKey } : {}),
          },
        })

        if (!res?.success || !res.data) {
          if (!options?.silent) {
            toast.error(res?.message || tbl.couldNotLoad)
          }
          return
        }

        setDetail({
          ...res.data,
          itemCount: res.data.itemCount ?? 0,
        })
        if (!options?.silent) {
          setDetailOpen(true)
        }

        const orderMerchantId =
          res.data.orders.find((o) => o.merchantId)?.merchantId ?? merchantId
        if (orderMerchantId) {
          const menuRes = await getApi<
            ApiResponse<{ restaurantName: string } | unknown[]>
          >({
            url: CONSUMER_MENU,
            param: { merchantId: String(orderMerchantId) },
          })
          if (menuRes?.success && menuRes.data && !Array.isArray(menuRes.data)) {
            setRestaurantName(
              menuRes.data.restaurantName ?? t.common.restaurant
            )
          }
        }
      } finally {
        loadDetailInFlightRef.current = false
      }
    },
    [merchantKey, merchantId, tbl.couldNotLoad, t.common.restaurant]
  )

  usePolling(
    () => {
      void fetchTables({ silent: hasLoadedRef.current })
    },
    5000,
    Boolean(merchantKey)
  )

  usePolling(
    () => {
      if (selectedTable) {
        void loadDetail(selectedTable, { silent: true })
      }
    },
    5000,
    detailOpen && Boolean(selectedTable)
  )

  const handleEnableSound = async () => {
    const ok = await enableSound()
    if (ok) toast.success(at.enableSound)
  }

  const dismissWaiterCall = React.useCallback(
    async (table: TableSummary) => {
      if (!merchantKey) return false

      const res = await patchApi<
        ApiResponse<{ modifiedCount?: number } | unknown>
      >({
        url: PATCH_WAITER_CALL,
        values: {
          merchantId: merchantKey,
          tableName: table.tableName,
          status: "done",
        },
      })

      if (!res?.success) {
        toast.error(res?.message || at.updateFailed)
        return false
      }

      setTables((prev) =>
        prev.map((row) =>
          row.tableName === table.tableName
            ? { ...row, waiterCalled: false, waiterCallId: undefined }
            : row
        )
      )
      return true
    },
    [at.updateFailed, merchantKey]
  )

  const handleOpenTable = async (tableName: string) => {
    const table = tables.find((row) => row.tableName === tableName)
    if (
      table &&
      getTableCardVisualState(table) === "waiter_called" &&
      table.waiterCalled
    ) {
      const dismissed = await dismissWaiterCall(table)
      if (dismissed) {
        toast.success(at.waiterCallHandled)
        void fetchTables({ silent: true })
      }
      return
    }

    setSelectedTable(tableName)
    void loadDetail(tableName)
  }

  const handleAcceptNewOrders = async (
    tableName: string,
    orderIds: string[]
  ) => {
    if (orderIds.length === 0) return

    setAcceptingTable(tableName)
    const previousTables = tables

    setTables((prev) =>
      prev.map((t) => {
        if (t.tableName !== tableName) return t
        const next = { ...t, newOrderIds: [] as string[] }
        if (t.status === "new") {
          return { ...next, status: "accepted" as TableDisplayStatus }
        }
        return next
      })
    )

    let ok = true
    for (const orderId of orderIds) {
      const res = await patchApi<ApiResponse<KitchenOrder>>({
        url: PATCH_KITCHEN_ORDER,
        values: { orderId, status: "accepted" },
      })
      if (!res?.success) ok = false
    }

    setAcceptingTable(null)

    if (!ok) {
      setTables(previousTables)
      toast.error(at.updateFailed)
      return
    }

    toast.success(at.orderAccepted)
    await fetchTables()
  }

  const handleMarkItemServed = async (
    tableName: string,
    orderId: string,
    itemIndex: number
  ) => {
    const key = `${orderId}-${itemIndex}`
    setMarkingServedKey(key)

    const previousTables = tables
    setTables((prev) =>
      prev.map((t) => {
        if (t.tableName !== tableName) return t
        return applyOptimisticItemServed(t, orderId, itemIndex) ?? t
      })
    )

    const res = await patchApi<ApiResponse<KitchenOrder>>({
      url: PATCH_KITCHEN_ORDER,
      values: { orderId, itemIndex, served: true },
    })

    setMarkingServedKey(null)

    if (!res?.success) {
      setTables(previousTables)
      toast.error(res?.message || at.updateFailed)
      return
    }

    await fetchTables()
    if (selectedTable && detailOpen) {
      loadDetail(selectedTable)
    }
  }

  const handleCloseModal = () => {
    setDetailOpen(false)
    setSelectedTable(null)
    setDetail(null)
  }

  const handleCloseTable = async () => {
    if (!selectedTable) return

    setClosing(true)
    const orderMerchantId =
      detail?.orders.find((o) => o.merchantId)?.merchantId ?? merchantId

    const res = await postApi<ApiResponse<{ modifiedCount: number }>>({
      url: POST_CLOSE_TABLE,
      values: {
        tableName: selectedTable,
        ...(orderMerchantId ? { merchantId: orderMerchantId } : {}),
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

  const displayHalls = React.useMemo(
    () => (halls.length > 0 ? halls : [defaultHall()]),
    [halls]
  )

  const tablesForHall = React.useMemo(
    () => filterTablesByHall(tables, selectedHallId),
    [tables, selectedHallId]
  )

  const handleAddHall = React.useCallback(async () => {
    if (!merchantKey || addingHall) return

    setAddingHall(true)
    const res = await postApi<
      ApiResponse<{ hall: TableHall; halls: TableHall[] }>
    >({
      url: POST_TABLE_HALL,
      values: {},
    })
    setAddingHall(false)

    if (!res?.success || !res.data) {
      toast.error(res?.message || fl.addHallFailed)
      return
    }

    setHalls(res.data.halls)
    setSelectedHallId(res.data.hall.id)
    toast.success(fl.hallAdded)
    void fetchTables({ silent: true })
  }, [addingHall, fl.addHallFailed, fl.hallAdded, fetchTables, merchantKey])

  const handleDeleteHall = React.useCallback(async () => {
    if (!merchantKey || deletingHall) return
    if (displayHalls.length <= 1) {
      toast.error(fl.deleteOnlyHallBlocked)
      return
    }
    if (!window.confirm(fl.deleteHallConfirm)) return

    setDeletingHall(true)
    const res = await deleteApi<ApiResponse<{ halls: TableHall[] }>>({
      url: DELETE_TABLE_HALL,
      param: { hallId: selectedHallId, merchantId: merchantKey },
    })
    setDeletingHall(false)

    if (!res?.success || !res.data) {
      toast.error(res?.message || fl.deleteHallFailed)
      return
    }

    setHalls(res.data.halls)
    setSelectedHallId((prev) => {
      if (res.data!.halls.some((hall) => hall.id === prev)) return prev
      return res.data!.halls[0]?.id ?? DEFAULT_HALL_ID
    })
    toast.success(fl.hallDeleted)
    void fetchTables({ silent: true })
  }, [
    deletingHall,
    displayHalls.length,
    fl.deleteHallConfirm,
    fl.deleteHallFailed,
    fl.deleteOnlyHallBlocked,
    fl.hallDeleted,
    fetchTables,
    merchantKey,
    selectedHallId,
  ])

  const hasLayouts = tablesForHall.some(
    (tbl) =>
      Boolean(tbl.layout) ||
      Boolean(layouts[tbl.tableName]) ||
      Boolean(tbl.layout?.id && layouts[tbl.layout.id])
  )

  return (
    <TooltipProvider delayDuration={200}>
      <div className="admin-tables-pos flex h-full min-h-0 w-full flex-col p-4">
        <header className="mb-2 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200/60 py-1">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            <SidebarMenuToggle />
            <LayoutGrid
              className="h-7 w-7 shrink-0 text-green-600"
              aria-hidden
            />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <h1 className="shrink-0 truncate text-lg font-bold text-slate-950">
                  {at.title}
                </h1>
                {!loading && (
                  <HallSelectorBar
                    variant="inline"
                    className="min-w-0 flex-1"
                    halls={displayHalls}
                    selectedHallId={selectedHallId}
                    onSelect={setSelectedHallId}
                    onAddHall={() => void handleAddHall()}
                    onDeleteHall={() => void handleDeleteHall()}
                    canDeleteHall={displayHalls.length > 1}
                    addHallLabel={fl.addHall}
                    deleteHallLabel={fl.deleteHall}
                  />
                )}
              </div>
              <p className="truncate text-xs text-slate-500">{at.subtitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 touch-manipulation text-slate-500"
                  aria-label={at.headerHelpLabel}
                >
                  <HelpCircle className="h-5 w-5" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="end"
                sideOffset={8}
                className="border border-slate-200 bg-white p-3 text-left text-slate-700 shadow-md"
              >
                <TableStatusLegendTooltip />
              </TooltipContent>
            </Tooltip>

            {!soundEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleEnableSound}
                    className="h-11 w-11 touch-manipulation text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                    aria-label={at.soundToggleTooltip}
                  >
                    <Volume2 className="h-5 w-5" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" sideOffset={6}>
                  {at.soundToggleTooltip}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 touch-manipulation text-[#4A7FE5] hover:bg-[#4A7FE5]/10"
                  aria-label={at.layoutTooltip}
                  onClick={() => setFloorLayoutOpen(true)}
                >
                  <Map className="h-5 w-5" aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" sideOffset={6}>
                {at.layoutTooltip}
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

      {loading && (
        <p className="shrink-0 text-center text-gray-500">{at.loading}</p>
      )}

      {!loading && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200/60 bg-white shadow-sm">
          {tables.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-12 text-center text-gray-500">
              {at.empty}
            </div>
          ) : tablesForHall.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-12 text-center text-gray-500">
              {fl.emptyHall}
            </div>
          ) : hasLayouts ? (
            <TableFloorPlan
              className="min-h-0 flex-1"
              tables={tablesForHall}
              layouts={layouts}
              onOpenTable={handleOpenTable}
              markingServedKey={markingServedKey}
              acceptingTable={acceptingTable}
              onAcceptNewOrders={handleAcceptNewOrders}
              onMarkItemServed={handleMarkItemServed}
            />
          ) : null}
        </div>
      )}

      <FloorLayoutModal
        open={floorLayoutOpen}
        onOpenChange={setFloorLayoutOpen}
        onSaved={(payload: FloorLayoutPayload) => {
          setHalls(payload.halls)
          const map: Record<string, FloorLayoutTable> = {}
          for (const layout of payload.layouts) {
            map[layout.tableName] = layout
            const layoutId = layout.id
            if (layoutId) map[layoutId] = layout
          }
          setLayouts(map)
          void fetchTables({ silent: true })
        }}
      />

      <AdminTableDetailModal
        open={detailOpen}
        detail={detail}
        merchantId={merchantKey}
        restaurantName={restaurantName || t.common.restaurant}
        closing={closing}
        onClose={handleCloseModal}
        onCloseTable={handleCloseTable}
        onOrdersChanged={() => {
          fetchTables()
          if (selectedTable) loadDetail(selectedTable)
        }}
      />
      </div>
    </TooltipProvider>
  )
}

export default AdminTablesPage

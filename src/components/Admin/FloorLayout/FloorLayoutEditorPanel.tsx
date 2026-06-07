"use client"

import React from "react"
import toast from "react-hot-toast"
import { useLocale } from "@/context/LocaleContext"
import { useAppSelector } from "@/hook/redux"
import { ApiResponse } from "@/utils/api"
import {
  DELETE_TABLE_LAYOUT_TABLE,
  GET_TABLES_LAYOUT,
  POST_TABLE_HALL,
  DELETE_TABLE_HALL,
  POST_TABLE_LAYOUT_TABLE,
  PUT_TABLES_LAYOUT,
} from "@/utils/APIConstant"
import { deleteApi, getApi, postApi, putApi } from "@/utils/common"
import type { FloorLayoutTable, FloorLayoutPayload, TableHall } from "@/types/floorLayout"
import { buildDefaultTableLayout } from "@/utils/tableFloorPlan"
import {
  clampFloorLayoutTable,
  createDefaultFloorTable,
  filterFloorLayoutsByHall,
  mergeHallLayouts,
  normalizeCircleDimensions,
  nextDefaultTableName,
  parseFloorLayoutPayload,
  rectToFloorLayout,
} from "@/utils/floorLayout"
import { snapshotFloorLayouts } from "@/utils/floorLayoutSnapshot"
import { DEFAULT_HALL_ID, defaultHall, resolveHallId } from "@/utils/tableHalls"
import {
  applyDuplicateDisplayLabels,
  hasDuplicateTableNames,
  isTableNameTaken,
  validateUniqueTableNames,
} from "@/utils/tableNameValidation"
import { FloorLayoutCanvas } from "./FloorLayoutCanvas"
import { FloorLayoutSidebar } from "./FloorLayoutSidebar"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RotateCcw, Save, X } from "lucide-react"

export type FloorLayoutEditorPanelProps = {
  active: boolean
  variant?: "page" | "modal"
  onSaved?: (payload: FloorLayoutPayload) => void
  onDirtyChange?: (dirty: boolean) => void
  onRequestClose?: () => void
}

export function FloorLayoutEditorPanel({
  active,
  variant = "page",
  onSaved,
  onDirtyChange,
  onRequestClose,
}: FloorLayoutEditorPanelProps) {
  const { t } = useLocale()
  const fl = t.floorLayout
  const at = t.adminTables
  const merchantId = useAppSelector((state) => state.merchant).merchant?._id
  const merchantKey = merchantId ? String(merchantId) : undefined

  const [allTables, setAllTables] = React.useState<FloorLayoutTable[]>([])
  const [halls, setHalls] = React.useState<TableHall[]>([defaultHall()])
  const [selectedHallId, setSelectedHallId] = React.useState(DEFAULT_HALL_ID)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [addingHall, setAddingHall] = React.useState(false)
  const [deletingHall, setDeletingHall] = React.useState(false)
  const savedSnapshotRef = React.useRef("")

  const tablesForHall = React.useMemo(
    () => filterFloorLayoutsByHall(allTables, selectedHallId),
    [allTables, selectedHallId]
  )

  const displayHalls = React.useMemo(
    () => (halls.length > 0 ? halls : [defaultHall()]),
    [halls]
  )

  const selected =
    tablesForHall.find((tbl) => tbl.id === selectedId) ??
    allTables.find((tbl) => tbl.id === selectedId) ??
    null
  const isModal = variant === "modal"

  const dirty = React.useMemo(
    () => snapshotFloorLayouts(allTables) !== savedSnapshotRef.current,
    [allTables]
  )

  React.useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  React.useEffect(() => {
    if (!tablesForHall.some((tbl) => tbl.id === selectedId)) {
      setSelectedId(tablesForHall[0]?.id ?? null)
    }
  }, [selectedHallId, tablesForHall, selectedId])

  React.useEffect(() => {
    if (!active || !merchantKey) {
      if (!active) setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await getApi<ApiResponse<FloorLayoutPayload | FloorLayoutTable[]>>({
          url: GET_TABLES_LAYOUT,
          param: { merchantId: merchantKey },
        })

        if (cancelled) return

        if (res?.success && res.data) {
          const payload = parseFloorLayoutPayload(res.data)
          setHalls(payload.halls)
          setAllTables(payload.layouts)
          savedSnapshotRef.current = snapshotFloorLayouts(payload.layouts)
          setSelectedHallId((prev) =>
            payload.halls.some((hall) => hall.id === prev)
              ? prev
              : payload.halls[0]?.id ?? DEFAULT_HALL_ID
          )
        }
      } catch {
        if (!cancelled) toast.error(fl.loadFailed)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [active, fl.loadFailed, merchantKey])

  const rejectDuplicateNames = (rows: FloorLayoutTable[]): boolean => {
    if (rows.some((row) => row.hasDuplicateName)) {
      toast.error(fl.duplicateName)
      return true
    }
    const check = validateUniqueTableNames(rows)
    if (!check.ok) {
      toast.error(check.message)
      return true
    }
    return false
  }

  const handleSave = async (): Promise<boolean> => {
    if (!merchantKey) return false

    const hallId = resolveHallId(selectedHallId)
    const normalized = tablesForHall.map((row) =>
      clampFloorLayoutTable({
        ...row,
        hallId,
        tableName: row.tableName.trim(),
        hasDuplicateName: false,
        displayLabel: undefined,
      })
    )

    for (const row of normalized) {
      if (!row.tableName) {
        toast.error(fl.nameRequired)
        return false
      }
    }

    if (rejectDuplicateNames(allTables)) return false

    setSaving(true)
    const res = await putApi<ApiResponse<FloorLayoutPayload>>({
      url: PUT_TABLES_LAYOUT,
      values: { hallId, layouts: normalized },
    })
    setSaving(false)

    if (!res?.success) {
      toast.error(res?.message || fl.duplicateName || fl.saveFailed)
      return false
    }

    const payload = parseFloorLayoutPayload(
      res.data ?? { halls, layouts: normalized }
    )
    setHalls(payload.halls)
    setAllTables((prev) =>
      mergeHallLayouts(prev, hallId, payload.layouts)
    )
    savedSnapshotRef.current = snapshotFloorLayouts(
      mergeHallLayouts(allTables, hallId, payload.layouts)
    )
    toast.success(fl.saved)
    const mergedAll = mergeHallLayouts(allTables, hallId, payload.layouts)
    onSaved?.({ halls: payload.halls, layouts: mergedAll })
    return true
  }

  const handleReset = () => {
    const sorted = [...tablesForHall].sort((a, b) =>
      a.tableName.localeCompare(b.tableName, undefined, { numeric: true })
    )
    const defaults = buildDefaultTableLayout(sorted.map((row) => row.tableName))

    const mergedHall = sorted.map((prev, index) => {
      const rect = defaults[index]
      return rectToFloorLayout(rect, {
        id: prev.id,
        hallId: selectedHallId,
        description: prev.description ?? rect.tableName,
        shape: prev.shape ?? "rectangle",
      })
    })

    const mergedAll = mergeHallLayouts(allTables, selectedHallId, mergedHall)
    if (rejectDuplicateNames(mergedAll)) return

    setAllTables(mergedAll)
    toast.success(fl.resetDone)
  }

  const handleAddHall = async () => {
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
  }

  const handleDeleteHall = async () => {
    if (!merchantKey || deletingHall) return
    if (displayHalls.length <= 1) {
      toast.error(fl.deleteOnlyHallBlocked)
      return
    }
    if (!window.confirm(fl.deleteHallConfirm)) return

    const deletedHallId = resolveHallId(selectedHallId)
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
    setAllTables((prev) => {
      const next = prev.filter(
        (table) => resolveHallId(table.hallId) !== deletedHallId
      )
      savedSnapshotRef.current = snapshotFloorLayouts(next)
      return next
    })
    setSelectedId(null)
    toast.success(fl.hallDeleted)
  }

  const handleAddTable = async (shape: FloorLayoutTable["shape"]) => {
    if (!merchantKey) return

    const hallId = resolveHallId(selectedHallId)
    const name = nextDefaultTableName(allTables.map((tbl) => tbl.tableName))
    const draft = createDefaultFloorTable(
      name,
      tablesForHall.length,
      allTables.map((tbl) => tbl.tableName)
    )
    draft.shape = shape
    draft.hallId = hallId
    if (shape === "circle") {
      const { width, height } = normalizeCircleDimensions(
        draft.width,
        draft.height
      )
      draft.width = width
      draft.height = height
    }

    const res = await postApi<ApiResponse<FloorLayoutTable>>({
      url: POST_TABLE_LAYOUT_TABLE,
      values: draft,
    })

    if (!res?.success || !res.data) {
      toast.error(res?.message || fl.duplicateName || fl.addFailed)
      return
    }

    const created = clampFloorLayoutTable({ ...res.data, hallId })
    setAllTables((prev) => applyDuplicateDisplayLabels([...prev, created]))
    setSelectedId(created.id)
    toast.success(fl.tableAdded)
  }

  const handleDeleteTable = async () => {
    if (!selected || !merchantKey) return

    const res = await deleteApi<ApiResponse<{ tableId: string }>>({
      url: DELETE_TABLE_LAYOUT_TABLE,
      param: { tableId: selected.id, merchantId: merchantKey },
    })

    if (!res?.success) {
      toast.error(res?.message || fl.deleteFailed)
      return
    }

    setAllTables((prev) => prev.filter((tbl) => tbl.id !== selected.id))
    setSelectedId(null)
    toast.success(fl.tableDeleted)
  }

  const updateSelected = (
    patch: Partial<FloorLayoutTable>,
    options?: { validateName?: boolean }
  ): boolean => {
    if (!selected) return false

    const rawName = patch.tableName ?? selected.tableName
    const next = clampFloorLayoutTable({
      ...selected,
      ...patch,
      hallId: resolveHallId(selected.hallId ?? selectedHallId),
      tableName:
        patch.tableName !== undefined ? rawName.trim() : selected.tableName,
    })

    const isNameChange = patch.tableName !== undefined
    const shouldValidateName = isNameChange && options?.validateName !== false

    if (shouldValidateName) {
      if (!next.tableName) {
        toast.error(fl.nameRequired)
        return false
      }

      if (isTableNameTaken(next.tableName, allTables, selected.id)) {
        toast.error(fl.duplicateName)
        return false
      }

      const nextTables = applyDuplicateDisplayLabels(
        allTables.map((tbl) => (tbl.id === selected.id ? next : tbl))
      )

      if (hasDuplicateTableNames(nextTables)) {
        toast.error(fl.duplicateName)
        return false
      }
    }

    setAllTables(
      applyDuplicateDisplayLabels(
        allTables.map((tbl) => (tbl.id === selected.id ? next : tbl))
      )
    )
    return true
  }

  const handleHallTableChange = (nextHallTables: FloorLayoutTable[]) => {
    setAllTables((prev) =>
      mergeHallLayouts(prev, selectedHallId, nextHallTables)
    )
  }

  const sidebarLabels = {
    addTable: fl.addTable,
    hallSettings: fl.hallSettings,
    deleteHall: fl.deleteHall,
    tableSettings: fl.tableSettings,
    name: fl.name,
    description: fl.description,
    size: fl.size,
    shape: fl.shape,
    deleteTable: fl.deleteTable,
    selectTableHint: fl.selectTableHint,
    rectangle: fl.shapeRectangle,
    circle: fl.shapeCircle,
  }

  const headerActions = (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleReset}
        disabled={loading || tablesForHall.length === 0 || saving}
        className="touch-manipulation"
      >
        <RotateCcw className="mr-1.5 h-4 w-4" />
        {fl.resetLayout}
      </Button>
      <Button
        type="button"
        size="sm"
        className="bg-[#4A7FE5] hover:bg-[#3d6fd4] touch-manipulation"
        onClick={() => void handleSave()}
        disabled={saving || loading}
      >
        <Save className="mr-1.5 h-4 w-4" />
        {saving ? "…" : fl.saveLayout}
      </Button>
    </>
  )

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f5f7]">
      {isModal ? (
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between gap-3 space-y-0 border-b border-slate-200 bg-white px-4 py-3 text-left">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {at.openFloorLayout}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {headerActions}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 touch-manipulation"
              aria-label={fl.closeEditor}
              onClick={onRequestClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
      ) : (
        <div className="flex shrink-0 justify-end gap-2 border-b border-slate-200 bg-white px-4 py-2">
          {headerActions}
        </div>
      )}

      {loading ? (
        <p className="flex flex-1 items-center justify-center text-slate-500">
          {fl.loading}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden p-3">
          <div className="flex min-h-0 flex-1 flex-row overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <FloorLayoutSidebar
              selected={selected}
              onUpdateSelected={updateSelected}
              onAddTable={(shape) => void handleAddTable(shape)}
              onDeleteTable={() => void handleDeleteTable()}
              onDeleteHall={() => void handleDeleteHall()}
              canDeleteHall={displayHalls.length > 1}
              labels={sidebarLabels}
            />
            <FloorLayoutCanvas
              tables={tablesForHall}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={handleHallTableChange}
              halls={displayHalls}
              selectedHallId={selectedHallId}
              onSelectHall={setSelectedHallId}
              onAddHall={() => void handleAddHall()}
              addHallLabel={fl.addHall}
              emptyHallMessage={fl.emptyHall}
            />
          </div>
        </div>
      )}
    </div>
  )
}

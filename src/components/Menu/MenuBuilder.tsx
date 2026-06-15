"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Trash2, LayoutGrid } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppSelector } from "@/hook/redux"

import { MenuItemGrid } from "./MenuItemGrid"
import {
  MenuSectionSidebar,
  mergeSectionOrder,
  saveMenuSectionOrder,
} from "./MenuSectionSidebar"
import {
  MenuItemEditModal,
  type EditableMenuItem,
} from "./MenuItemEditModal"
import { MenuItemCreateModal } from "./MenuItemCreateModal"
import { MenuAdminAddButton } from "./MenuAdminAddButton"
import {
  buildSectionUpdateFormData,
  type MenuItemSectionSource,
} from "./menuItemSection"
import { findItemDropSection } from "./useTouchItemDrag"
import {
  buildSectionItemOrdersFromItems,
  findItemReorderInsertIndex,
  persistMenuItemMove,
  persistMenuItemOrder,
  persistMenuItemRemoval,
  persistMenuSectionRemoval,
  persistUpsertSection,
  reorderItemIds,
} from "./menuItemOrder"
import {
  MenuCategoryModal,
  DEFAULT_CATEGORY_ICON,
  type CategoryFormValues,
} from "./MenuCategoryModal"
import type { CategoryIconName } from "@/utils/categoryIcons"
import type { SectionMetaMap } from "@/utils/sectionMeta"
import { buildSectionMetaFromKeys } from "@/utils/sectionMeta"
import { ApiResponse } from "@/utils/api"
import { deleteApi, getApi, getApiErrorMessage, patchApi } from "@/utils/common"
import {
  MENUBUILDER_LISTS,
  MENU_ITEM_BY_ID,
  REMOVE_SECTION,
} from "@/utils/APIConstant"
import { MUJIN_MENU_SECTIONS } from "@/data/mujinMenuSeed"
import { IMenu } from "@/types/menu"
import { normalizeMenuDocument } from "@/utils/menuBilingual"
import { normalizeSpicyLevel } from "@/utils/menuSpicy"
import type { MenuSizeOption } from "@/types/menu"
import { toMenuItemId } from "@/utils/menuItemId"

interface MenuSection {
  key: string
}

interface MenuItem {
  id: string
  section: string
  title: string
  nameMn: string
  nameEn: string
  descriptionMn?: string
  descriptionEn?: string
  price: number
  originalPrice?: number
  quantity: number
  image: string
  spicyLevel: number
  available: boolean
  sizes?: MenuSizeOption[]
}

const MenuBuilderTabs = () => {
  const merchantId = useAppSelector((state) => state.merchant).merchant?._id
  const [sections, setSections] = useState<MenuSection[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [activeSection, setActiveSection] = useState("")

  const [sectionMeta, setSectionMeta] = useState<SectionMetaMap>({})
  const [sectionIcons, setSectionIcons] = useState<
    Record<string, CategoryIconName>
  >({})
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryModalMode, setCategoryModalMode] = useState<"create" | "edit">(
    "create"
  )
  const [categoryModalKey, setCategoryModalKey] = useState<string | undefined>()
  const [categoryModalInitial, setCategoryModalInitial] =
    useState<CategoryFormValues>()
  const [categorySaving, setCategorySaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [updatingSectionItemId, setUpdatingSectionItemId] = useState<
    string | null
  >(null)
  const [touchDraggingId, setTouchDraggingId] = useState<string | null>(null)
  const [touchDropSection, setTouchDropSection] = useState<string | null>(null)
  const [touchGhostPos, setTouchGhostPos] = useState({ x: 0, y: 0 })
  const touchGhostLabelRef = useRef("")
  const [sectionItemOrders, setSectionItemOrders] = useState<
    Record<string, string[]>
  >({})
  const [gridDraggingItemId, setGridDraggingItemId] = useState<string | null>(
    null
  )
  const [gridInsertIndex, setGridInsertIndex] = useState<number | null>(null)

  const loadMenu = async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true)
    try {
      const res = await getApi<
        ApiResponse<
          | IMenu[]
          | {
              menu: IMenu[]
              merchantId: string
              count: number
              order?: {
                sectionOrder: string[]
                itemOrders: Record<string, string[]>
                sectionIcons?: Record<string, CategoryIconName>
                sectionMeta?: SectionMetaMap
              }
            }
        >
      >({
        url: `${MENUBUILDER_LISTS}?debug=1`,
      })

      console.info("[MenuBuilder] GET /api/menu/lists", res)

      if (!res?.success) {
        toast.error(getApiErrorMessage(res, "Цэс ачаалж чадсангүй"), {
          duration: 8000,
        })
        return
      }

      const raw = res.data
      const rows = Array.isArray(raw)
        ? raw
        : raw && typeof raw === "object" && "menu" in raw && Array.isArray(raw.menu)
          ? raw.menu
          : null

      if (!rows) {
        toast.error(
          getApiErrorMessage(res, "Цэсний жагсаалтын хариу буруу байна"),
          { duration: 8000 }
        )
        return
      }

      const listMeta =
        raw && typeof raw === "object" && "count" in raw
          ? (raw as {
              merchantId?: string
              count?: number
              order?: {
                sectionOrder: string[]
                itemOrders: Record<string, string[]>
                sectionIcons?: Record<string, CategoryIconName>
                sectionMeta?: SectionMetaMap
              }
            })
          : null

      const savedOrder = listMeta?.order ?? {
        sectionOrder: [] as string[],
        itemOrders: {} as Record<string, string[]>,
        sectionIcons: {} as Record<string, CategoryIconName>,
        sectionMeta: {} as SectionMetaMap,
      }

      setSectionIcons(savedOrder.sectionIcons ?? {})

      if (listMeta?.count != null) {
        console.info(
          `[MenuBuilder] merchantId=${listMeta.merchantId} count=${listMeta.count}`
        )
      }

      const mappedItems: MenuItem[] = rows.map((raw) => {
        const item = normalizeMenuDocument(raw)
        return {
          id: toMenuItemId(item._id),
          section: item.section,
          title: item.title,
          nameMn: item.nameMn,
          nameEn: item.nameEn,
          descriptionMn: item.descriptionMn || undefined,
          descriptionEn: item.descriptionEn || undefined,
          price: item.price,
          quantity: item.quantity,
          originalPrice: item.originalPrice,
          image: item.image,
          spicyLevel: normalizeSpicyLevel(item.spicyLevel, item.spicy),
          available: item.available !== false,
          sizes: item.sizes,
        }
      })

      setItems(mappedItems)
      setSectionItemOrders(
        buildSectionItemOrdersFromItems(mappedItems, savedOrder.itemOrders)
      )

      const labelsInData = Array.from(new Set(mappedItems.map((i) => i.section)))
      const allSectionKeys = Array.from(
        new Set([...labelsInData, ...savedOrder.sectionOrder])
      )
      const defaultOrder = [
        ...MUJIN_MENU_SECTIONS.filter((s) => allSectionKeys.includes(s)),
        ...allSectionKeys.filter(
          (s) => !(MUJIN_MENU_SECTIONS as readonly string[]).includes(s)
        ),
      ]
      const ordered = mergeSectionOrder(
        allSectionKeys,
        savedOrder.sectionOrder,
        defaultOrder
      )
      const mergedMeta = buildSectionMetaFromKeys(
        ordered,
        savedOrder.sectionMeta ?? {}
      )
      setSectionMeta(mergedMeta)
      setSections(ordered.map((key) => ({ key })))

      if (ordered.length > 0) {
        setActiveSection((prev) =>
          prev && ordered.includes(prev) ? prev : ordered[0]
        )
      }
    } catch (err) {
      console.error("Failed to fetch menu", err)
      toast.error("Цэс ачаалж чадсангүй")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadMenu()
  }, [])

  const openCreateCategoryModal = () => {
    setCategoryModalMode("create")
    setCategoryModalKey(undefined)
    setCategoryModalInitial({
      labelMn: "",
      labelEn: "",
      icon: DEFAULT_CATEGORY_ICON,
    })
    setCategoryModalOpen(true)
  }

  const openEditCategoryModal = (key: string) => {
    const meta = sectionMeta[key]
    setCategoryModalMode("edit")
    setCategoryModalKey(key)
    setCategoryModalInitial({
      labelMn: meta?.labelMn ?? key,
      labelEn: meta?.labelEn ?? key,
      icon: sectionIcons[key] ?? DEFAULT_CATEGORY_ICON,
    })
    setCategoryModalOpen(true)
  }

  const handleSaveCategory = async (values: CategoryFormValues) => {
    setCategorySaving(true)
    try {
      const result = await persistUpsertSection({
        key: categoryModalMode === "edit" ? categoryModalKey : undefined,
        labelMn: values.labelMn,
        labelEn: values.labelEn,
        icon: values.icon,
      })

      if (!result.success) {
        toast.error(result.message || "Ангилал хадгалж чадсангүй")
        return
      }

      const savedKey = result.key ?? values.labelMn
      const oldKey = categoryModalKey

      if (categoryModalMode === "create") {
        setSections((prev) => [...prev, { key: savedKey }])
        setActiveSection(savedKey)
      } else if (oldKey && oldKey !== savedKey) {
        setSections((prev) =>
          prev.map((section) =>
            section.key === oldKey ? { key: savedKey } : section
          )
        )
        setItems((prev) =>
          prev.map((item) =>
            item.section === oldKey ? { ...item, section: savedKey } : item
          )
        )
        setSectionItemOrders((prev) => {
          if (!prev[oldKey]) return prev
          const next = { ...prev }
          next[savedKey] = prev[oldKey]
          delete next[oldKey]
          return next
        })
        if (activeSection === oldKey) {
          setActiveSection(savedKey)
        }
      }

      setSectionMeta((prev) => {
        const next = { ...prev, [savedKey]: { labelMn: values.labelMn, labelEn: values.labelEn } }
        if (oldKey && oldKey !== savedKey) {
          delete next[oldKey]
        }
        return next
      })
      setSectionIcons((prev) => {
        const next = { ...prev, [savedKey]: values.icon }
        if (oldKey && oldKey !== savedKey) {
          delete next[oldKey]
        }
        return next
      })

      setCategoryModalOpen(false)
      toast.success(
        categoryModalMode === "create"
          ? "Ангилал нэмэгдлээ"
          : "Ангилал шинэчлэгдлээ"
      )
      void loadMenu({ silent: true })
    } catch {
      toast.error("Ангилал хадгалж чадсангүй")
    } finally {
      setCategorySaving(false)
    }
  }

  const deleteSection = async () => {
    if (!activeSection) return

    try {
      toast.loading("Ангилал устгаж байна...", { id: "delete-section" })

      const res = await deleteApi<ApiResponse<IMenu>>({
        url: REMOVE_SECTION,
        param: { section: activeSection },
      })

      if (!res?.success) {
        throw new Error(res?.message)
      }

      setItems((p) => p.filter((i) => i.section !== activeSection))
      setSectionItemOrders((prev) => {
        const next = { ...prev }
        delete next[activeSection]
        void persistMenuSectionRemoval(activeSection)
        return next
      })
      setSectionIcons((prev) => {
        const next = { ...prev }
        delete next[activeSection]
        return next
      })
      setSectionMeta((prev) => {
        const next = { ...prev }
        delete next[activeSection]
        return next
      })
      setSections((p) => {
        const next = p.filter((s) => s.key !== activeSection)
        void saveMenuSectionOrder(next.map((s) => s.key))
        return next
      })

      const remaining = sections.filter(
        (s) => s.key !== activeSection
      )

      setActiveSection(remaining[0]?.key || "")

      toast.success("Ангилал устгагдлаа", { id: "delete-section" })
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Ангилал устгаж чадсангүй",
        { id: "delete-section" }
      )
    }
  }

  const deleteItem = (id: string) => {
    const item = items.find((entry) => entry.id === id)
    setItems((p) => p.filter((i) => i.id !== id))
    if (!item) return
    setSectionItemOrders((prev) => {
      const section = item.section
      const ordered = (prev[section] ?? []).filter((entryId) => entryId !== id)
      void persistMenuItemRemoval(section, id)
      return { ...prev, [section]: ordered }
    })
  }

  const editingItem: EditableMenuItem | null =
    editingItemId != null
      ? (() => {
          const found = items.find((i) => i.id === editingItemId)
          if (!found) return null
          return {
            id: found.id,
            section: found.section,
            nameMn: found.nameMn,
            nameEn: found.nameEn,
            descriptionMn: found.descriptionMn,
            descriptionEn: found.descriptionEn,
            price: found.price,
            image: found.image,
            spicyLevel: found.spicyLevel,
            available: found.available,
            sizes: found.sizes,
          }
        })()
      : null

  const sectionLabels = sections.map((s) => s.key)

  const handleSectionReorder = (keys: string[]) => {
    setSections(keys.map((key) => ({ key })))
    void saveMenuSectionOrder(keys)
  }

  const activeSectionMeta = sectionMeta[activeSection]

  const toSectionSource = (item: MenuItem): MenuItemSectionSource => ({
    id: item.id,
    nameMn: item.nameMn,
    nameEn: item.nameEn,
    descriptionMn: item.descriptionMn,
    descriptionEn: item.descriptionEn,
    price: item.price,
    section: item.section,
    spicyLevel: item.spicyLevel,
    available: item.available,
    sizes: item.sizes,
  })

  const assignItemToSection = useCallback(
    async (itemId: string, targetSection: string) => {
      const item = items.find((entry) => entry.id === itemId)
      if (!item || item.section === targetSection) return
      if (updatingSectionItemId) return

      setUpdatingSectionItemId(itemId)
      try {
        const res = await patchApi<ApiResponse<IMenu>>({
          url: MENU_ITEM_BY_ID(itemId),
          values: buildSectionUpdateFormData(toSectionSource(item), targetSection),
        })

        if (!res?.success) {
          throw new Error(res?.message || "Could not update category")
        }

        setItems((prev) =>
          prev.map((entry) =>
            entry.id === itemId ? { ...entry, section: targetSection } : entry
          )
        )
        setSectionItemOrders((prev) => {
          const fromSection = item.section
          const next = { ...prev }
          next[fromSection] = (next[fromSection] ?? []).filter((id) => id !== itemId)
          next[targetSection] = [...(next[targetSection] ?? []), itemId]
          void persistMenuItemMove(itemId, fromSection, targetSection)
          return next
        })
        toast.success("Category updated successfully")
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Could not update category"
        toast.error(message)
      } finally {
        setUpdatingSectionItemId(null)
      }
    },
    [items, updatingSectionItemId]
  )

  const activeSectionOrderedIds =
    sectionItemOrders[activeSection] ??
    items.filter((entry) => entry.section === activeSection).map((entry) => entry.id)

  const handleSectionItemReorder = useCallback(
    (section: string, orderedIds: string[]) => {
      setSectionItemOrders((prev) => {
        const next = { ...prev, [section]: orderedIds }
        void persistMenuItemOrder(section, orderedIds)
        return next
      })
    },
    []
  )

  const handleTouchDragStart = useCallback(
    (itemId: string) => {
      const item = items.find((entry) => entry.id === itemId)
      touchGhostLabelRef.current = item?.nameMn || item?.nameEn || "Menu item"
      setTouchDraggingId(itemId)
      setGridDraggingItemId(itemId)
    },
    [items]
  )

  const handleTouchDragMove = useCallback(
    (clientX: number, clientY: number) => {
      setTouchGhostPos({ x: clientX, y: clientY })
      const section = findItemDropSection(clientX, clientY)
      setTouchDropSection(section)
      if (section) {
        setGridInsertIndex(null)
        return
      }
      const insertAt = findItemReorderInsertIndex(
        clientX,
        clientY,
        activeSectionOrderedIds
      )
      setGridInsertIndex(insertAt)
    },
    [activeSectionOrderedIds]
  )

  const handleTouchDragEnd = useCallback(
    (clientX: number, clientY: number, itemId: string) => {
      const section = findItemDropSection(clientX, clientY)
      setTouchDraggingId(null)
      setTouchDropSection(null)
      setGridDraggingItemId(null)
      setGridInsertIndex(null)

      if (section) {
        void assignItemToSection(itemId, section)
        return
      }

      const insertAt = findItemReorderInsertIndex(
        clientX,
        clientY,
        activeSectionOrderedIds
      )
      if (insertAt === null) return

      const next = reorderItemIds(activeSectionOrderedIds, itemId, insertAt)
      if (next.join("|") !== activeSectionOrderedIds.join("|")) {
        handleSectionItemReorder(activeSection, next)
      }
    },
    [
      activeSection,
      activeSectionOrderedIds,
      assignItemToSection,
      handleSectionItemReorder,
    ]
  )

  const updateItemSpicyLevel = (id: string, spicyLevel: number) => {
    setItems((p) =>
      p.map((i) => (i.id === id ? { ...i, spicyLevel } : i))
    )
  }

  const itemsById = new Map(
    items.map((entry) => [
      entry.id,
      {
        id: entry.id,
        image: entry.image,
        nameMn: entry.nameMn,
        nameEn: entry.nameEn,
        descriptionMn: entry.descriptionMn,
        quantity: entry.quantity,
        price: entry.price,
        originalPrice: entry.originalPrice,
        spicyLevel: entry.spicyLevel,
      },
    ])
  )

  const draggingItemId = gridDraggingItemId ?? touchDraggingId

  if (loading) {
    return (
      <Card className="h-[300px] flex items-center justify-center">
        Цэс ачааллаж байна...
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <MenuCategoryModal
        open={categoryModalOpen}
        mode={categoryModalMode}
        initial={categoryModalInitial}
        saving={categorySaving}
        onClose={() => setCategoryModalOpen(false)}
        onSave={handleSaveCategory}
      />

      <MenuItemEditModal
        open={editingItemId != null && editingItem != null}
        onOpenChange={(open) => {
          if (!open) setEditingItemId(null)
        }}
        item={editingItem}
        sectionOptions={sectionLabels}
        onSaved={() => {
          setEditingItemId(null)
          void loadMenu({ silent: true })
        }}
        onDeleted={(id) => {
          deleteItem(id)
          setEditingItemId(null)
          void loadMenu({ silent: true })
        }}
      />

      <MenuItemCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        sectionOptions={sectionLabels}
        defaultSection={activeSection}
        onCreated={() => void loadMenu({ silent: true })}
      />

      {touchDraggingId ? (
        <div
          className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-green-500 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-lg"
          style={{
            left: touchGhostPos.x,
            top: touchGhostPos.y,
          }}
        >
          {touchGhostLabelRef.current}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
      {/* LEFT – SECTIONS */}
      <Card className="flex min-h-[min(560px,calc(100vh-11rem))] flex-col">
        <CardHeader className="shrink-0 space-y-3 pb-3">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} />
            <CardTitle className="text-base">Цэсний ангилал</CardTitle>
          </div>
          <MenuAdminAddButton
            className="w-full justify-start"
            onClick={openCreateCategoryModal}
          >
            + Ангилал нэмэх
          </MenuAdminAddButton>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col pb-4 pt-0">
          <MenuSectionSidebar
            sections={sections.map((section) => ({
              key: section.key,
              label: sectionMeta[section.key]?.labelMn ?? section.key,
              icon: sectionIcons[section.key],
            }))}
            activeSection={activeSection}
            onSelect={setActiveSection}
            onEdit={openEditCategoryModal}
            onReorder={handleSectionReorder}
            onItemDrop={(itemId, targetSection) => {
              void assignItemToSection(itemId, targetSection)
            }}
            itemDropHighlight={touchDropSection}
            className="min-h-0 flex-1"
          />
        </CardContent>
      </Card>

      {/* RIGHT – ITEMS */}
      <div className="space-y-6">
        {!activeSection ? (
          <Card className="h-[300px] flex items-center justify-center text-muted-foreground">
            Эхлэхийн тулд ангилал сонгоно уу
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {activeSectionMeta?.labelMn ?? activeSection}
                    </h2>
                    {activeSectionMeta?.labelEn ? (
                      <p className="text-sm text-muted-foreground">
                        {activeSectionMeta.labelEn}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">
                      Энэ ангиллын хоолнууд
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="destructive"
                      aria-label="Ангилал устгах"
                      onClick={deleteSection}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                <MenuAdminAddButton
                  disabled={loading || sectionLabels.length === 0}
                  onClick={() => setCreateModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  + Мэню нэмэх
                </MenuAdminAddButton>
              </CardContent>
            </Card>

            <MenuItemGrid
              orderedIds={activeSectionOrderedIds}
              itemsById={itemsById}
              insertIndex={gridInsertIndex}
              draggingItemId={draggingItemId}
              onReorder={(orderedIds) =>
                handleSectionItemReorder(activeSection, orderedIds)
              }
              onDragStateChange={setGridDraggingItemId}
              onInsertIndexChange={setGridInsertIndex}
              onSpicyLevelChange={updateItemSpicyLevel}
              onEdit={setEditingItemId}
              onTouchDragStart={handleTouchDragStart}
              onTouchDragMove={handleTouchDragMove}
              onTouchDragEnd={handleTouchDragEnd}
            />
          </>
        )}
      </div>
      </div>
    </div>
  )
}

export default MenuBuilderTabs

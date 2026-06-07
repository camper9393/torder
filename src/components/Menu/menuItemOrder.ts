import { patchApi } from "@/utils/common"
import { MENU_ORDER } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import type { MenuOrderSnapshot } from "@/utils/menuOrderStore"
import {
  buildSectionItemOrders,
  mergeItemOrder,
  reorderItemIds,
} from "@/utils/menuOrder"

export {
  buildSectionItemOrders,
  mergeItemOrder,
  reorderItemIds,
} from "@/utils/menuOrder"

export function findItemReorderInsertIndex(
  clientX: number,
  clientY: number,
  orderedIds: string[]
): number | null {
  for (let i = 0; i < orderedIds.length; i++) {
    const el = document.querySelector(
      `[data-item-reorder-slot="${orderedIds[i]}"]`
    )
    if (!(el instanceof HTMLElement)) continue

    const rect = el.getBoundingClientRect()
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      continue
    }

    const before = clientY < rect.top + rect.height / 2
    return before ? i : i + 1
  }
  return null
}

export async function persistMenuItemOrder(section: string, ids: string[]) {
  await patchApi({
    url: MENU_ORDER,
    values: { itemOrder: { section, ids } },
  })
}

export async function persistMenuItemMove(
  itemId: string,
  fromSection: string,
  toSection: string
) {
  await patchApi({
    url: MENU_ORDER,
    values: {
      moveItem: { itemId, fromSection, toSection },
    },
  })
}

export async function persistMenuItemRemoval(section: string, itemId: string) {
  await patchApi({
    url: MENU_ORDER,
    values: { removeItem: { section, itemId } },
  })
}

export async function persistMenuSectionRename(from: string, to: string) {
  await patchApi({
    url: MENU_ORDER,
    values: { renameSection: { from, to } },
  })
}

export async function persistMenuSectionIcon(
  section: string,
  icon: string
): Promise<boolean> {
  const res = await patchApi<ApiResponse<MenuOrderSnapshot>>({
    url: MENU_ORDER,
    values: { sectionIcon: { section, icon } },
  })
  return res?.success === true
}

export async function persistUpsertSection(payload: {
  key?: string
  labelMn: string
  labelEn: string
  icon: string
}): Promise<{ success: boolean; key?: string; message?: string }> {
  const res = await patchApi<
    ApiResponse<MenuOrderSnapshot & { key?: string }>
  >({
    url: MENU_ORDER,
    values: { upsertSection: payload },
  })
  if (!res?.success) {
    return { success: false, message: res?.message }
  }
  const savedKey =
    payload.key && payload.key === payload.labelMn.trim()
      ? payload.key
      : payload.labelMn.trim()
  return { success: true, key: savedKey }
}

export async function persistMenuSectionRemoval(section: string) {
  await patchApi({
    url: MENU_ORDER,
    values: { removeSection: section },
  })
}

export function buildSectionItemOrdersFromItems(
  items: { id: string; section: string }[],
  savedItemOrders: Record<string, string[]> = {}
) {
  return buildSectionItemOrders(items, savedItemOrders)
}

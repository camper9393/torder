import { getMessages, localeToDateLocale } from "@/utils/i18n"
import { Locale } from "@/utils/i18n/types"

export const TABLET_BLUE = "#1E5EFF"
export const TABLET_BLUE_DARK = "#1548D4"
export const TABLET_BG = "#E8EDF5"

/** Korean paper-menu tablet theme */
export const PAPER_BG = "#121110"
export const PAPER_BG_ELEVATED = "#1c1916"
export const PAPER_GOLD = "#c9a227"
export const PAPER_GOLD_LIGHT = "#e8d4a8"
export const PAPER_GOLD_DIM = "#8a7344"
export const PAPER_CREAM = "#f3e8cf"
export const PAPER_BORDER = "rgba(201, 162, 39, 0.35)"

/** Korean t'order layout (consumer ordering page). */
export const TORDER_SIDEBAR_WIDTH_PX = 220
export const TORDER_BOTTOM_BAR_HEIGHT_PX = 72
export const TORDER_BLACK = "#111111"
export const TORDER_BLACK_SOFT = "#2a2a2a"
export const TORDER_RED = "#e53935"

/** Fixed mobile order bar (below xl). */
export const MOBILE_ORDER_BAR_HEIGHT_PX = 72
/** Bottom nav sits under the order bar. */
export const MOBILE_BOTTOM_NAV_HEIGHT_PX = 68
/** Menu scroll padding above order bar + bottom nav below xl. */
export const MOBILE_MENU_SCROLL_PADDING_BOTTOM = `calc(${MOBILE_ORDER_BAR_HEIGHT_PX}px + ${MOBILE_BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + 16px)`

export type TabletLocale = Locale

export type SortOption = "default" | "price-asc" | "price-desc" | "name"

export function sectionDescription(section: string, locale: Locale = "mn"): string {
  return getMessages(locale).sectionDescription(section)
}

export function sortMenuItems<T extends { title: string; price: number; createdAt?: Date | string }>(
  items: T[],
  sort: SortOption,
  locale: Locale = "mn"
): T[] {
  const collator = localeToDateLocale(locale).split("-")[0]
  const list = [...items]
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price)
    case "price-desc":
      return list.sort((a, b) => b.price - a.price)
    case "name":
      return list.sort((a, b) => a.title.localeCompare(b.title, collator))
    default:
      return list
  }
}

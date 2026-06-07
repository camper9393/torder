import { IMenu } from "@/types/menu"

export type MenuCardBadge = "BEST" | "NEW" | "HOT" | "VEG"

const BADGE_SET = new Set<MenuCardBadge>(["BEST", "NEW", "HOT", "VEG"])

function normalizeBadge(value: unknown): MenuCardBadge | null {
  if (typeof value !== "string") return null
  const upper = value.trim().toUpperCase()
  return BADGE_SET.has(upper as MenuCardBadge)
    ? (upper as MenuCardBadge)
    : null
}

/** Reads optional badge data from menu item without requiring DB schema changes. */
export function resolveMenuCardBadges(item: IMenu): MenuCardBadge[] {
  const direct = (item as IMenu & { badges?: unknown }).badges
  if (Array.isArray(direct)) {
    const parsed = direct
      .map(normalizeBadge)
      .filter((b): b is MenuCardBadge => b != null)
    if (parsed.length > 0) return [...new Set(parsed)]
  }

  const extended = item as IMenu & Record<string, unknown>
  const fromFlags: MenuCardBadge[] = []
  if (extended.isBest === true || extended.best === true) fromFlags.push("BEST")
  if (extended.isNew === true || extended.new === true) fromFlags.push("NEW")
  if (extended.isHot === true || extended.hot === true) fromFlags.push("HOT")
  if (extended.isVeg === true || extended.veg === true) fromFlags.push("VEG")

  return [...new Set(fromFlags)]
}

export const MENU_BADGE_STYLES: Record<
  MenuCardBadge,
  { pill: string; label: string }
> = {
  BEST: {
    label: "BEST",
    pill: "bg-red-600 text-white",
  },
  NEW: {
    label: "NEW",
    pill: "bg-emerald-500 text-white",
  },
  HOT: {
    label: "HOT",
    pill: "bg-orange-500 text-white",
  },
  VEG: {
    label: "VEG",
    pill: "bg-lime-600 text-white",
  },
}

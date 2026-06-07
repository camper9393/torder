import {
  BadgePercent,
  Beef,
  Beer,
  Bone,
  Cake,
  CakeSlice,
  Candy,
  ChefHat,
  Cigarette,
  Clock,
  Coffee,
  Cookie,
  CookingPot,
  Croissant,
  CupSoda,
  Donut,
  Drumstick,
  Egg,
  Fish,
  Flame,
  Gift,
  GlassWater,
  Ham,
  Heart,
  IceCream,
  Martini,
  Milk,
  Music,
  Package,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Sparkles,
  Star,
  Utensils,
  UtensilsCrossed,
  Wheat,
  Wine,
  type LucideIcon,
} from "lucide-react"

export const DEFAULT_CATEGORY_ICON = "Utensils"

/** All supported category icon keys (stored in DB). */
export const CATEGORY_ICON_MAP = {
  Utensils,
  CookingPot,
  Soup,
  Salad,
  Sandwich,
  Pizza,
  Fish,
  Beef,
  Drumstick,
  Egg,
  Flame,
  ChefHat,
  Wheat,
  UtensilsCrossed,
  Ham,
  Bone,
  Beer,
  Wine,
  Martini,
  GlassWater,
  CupSoda,
  Music,
  Cigarette,
  Coffee,
  Milk,
  IceCream,
  Croissant,
  Cake,
  CakeSlice,
  Cookie,
  Candy,
  Donut,
  Star,
  Heart,
  Gift,
  Sparkles,
  BadgePercent,
  Clock,
  Package,
} as const satisfies Record<string, LucideIcon>

export type CategoryIconName = keyof typeof CATEGORY_ICON_MAP

export const CATEGORY_ICON_OPTIONS = Object.keys(
  CATEGORY_ICON_MAP
) as CategoryIconName[]

export type CategoryIconGroup = {
  id: string
  label: string
  icons: CategoryIconName[]
}

/** Grouped picker layout for admin UI (icons may repeat across groups). */
export const CATEGORY_ICON_GROUPS: CategoryIconGroup[] = [
  {
    id: "restaurant",
    label: "Ресторан / Ерөнхий хоол",
    icons: [
      "Utensils",
      "CookingPot",
      "Soup",
      "Salad",
      "Sandwich",
      "Pizza",
      "Fish",
      "Beef",
      "Drumstick",
      "Egg",
      "Flame",
    ],
  },
  {
    id: "asian",
    label: "Солонгос / Азийн хоол",
    icons: [
      "Soup",
      "ChefHat",
      "Wheat",
      "UtensilsCrossed",
      "Fish",
      "Beef",
      "Flame",
    ],
  },
  {
    id: "meat",
    label: "Махны ресторан",
    icons: ["Beef", "Drumstick", "Ham", "Bone", "Flame", "CookingPot"],
  },
  {
    id: "pub",
    label: "Pub / Bar",
    icons: [
      "Beer",
      "Wine",
      "Martini",
      "GlassWater",
      "CupSoda",
      "Music",
      "Cigarette",
    ],
  },
  {
    id: "cafe",
    label: "Кафе",
    icons: ["Coffee", "CupSoda", "Milk", "IceCream", "Croissant", "CakeSlice"],
  },
  {
    id: "bakery",
    label: "Bakery / Амттан",
    icons: ["Cake", "CakeSlice", "Croissant", "Cookie", "IceCream", "Candy", "Donut"],
  },
  {
    id: "drinks",
    label: "Ундаа",
    icons: [
      "Coffee",
      "CupSoda",
      "GlassWater",
      "Wine",
      "Beer",
      "Martini",
      "Milk",
    ],
  },
  {
    id: "other",
    label: "Бусад",
    icons: [
      "Star",
      "Heart",
      "Gift",
      "Sparkles",
      "BadgePercent",
      "Clock",
      "Package",
    ],
  },
]

export function isCategoryIconName(value: string): value is CategoryIconName {
  return value in CATEGORY_ICON_MAP
}

export function resolveCategoryIconName(
  value: string | null | undefined
): CategoryIconName {
  if (value && isCategoryIconName(value)) return value
  return DEFAULT_CATEGORY_ICON
}

export function getCategoryLucideIcon(
  value: string | null | undefined
): LucideIcon {
  return CATEGORY_ICON_MAP[resolveCategoryIconName(value)]
}

export function sanitizeSectionIcons(
  raw: Record<string, unknown> | null | undefined
): Record<string, CategoryIconName> {
  if (!raw || typeof raw !== "object") return {}

  const next: Record<string, CategoryIconName> = {}
  for (const [section, icon] of Object.entries(raw)) {
    if (typeof section !== "string" || !section.trim()) continue
    if (typeof icon !== "string" || !isCategoryIconName(icon)) continue
    next[section] = icon
  }
  return next
}

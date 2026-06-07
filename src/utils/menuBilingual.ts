import type { IMenu, MenuSizeOption } from "@/types/menu"
import type { Locale } from "@/utils/i18n/types"
import { resolveOrderLinePrice } from "@/utils/orderLineMapping"
import { parseMoneyAmount } from "@/utils/parseMoneyAmount"

/** App UI locales; Korean uses Mongolian menu copy when EN fields are empty. */
export type MenuLocale = Locale

export type BilingualMenuSize = MenuSizeOption

export type BilingualMenuFields = {
  nameMn: string
  nameEn: string
  descriptionMn: string
  descriptionEn: string
  title: string
  description?: string
  sizes?: BilingualMenuSize[]
  price: number
}

type RawMenu = Partial<IMenu> & {
  nameMn?: string
  nameEn?: string
  descriptionMn?: string
  descriptionEn?: string
  nameMongolian?: string
  nameEnglish?: string
  descriptionMongolian?: string
  descriptionEnglish?: string
  sizes?: Array<Partial<MenuSizeOption> & Partial<BilingualMenuSize>>
}

export function parseTitleBilingual(title: string): {
  nameMn: string
  nameEn: string
} {
  const trimmed = title.trim()
  const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
  if (match) {
    return { nameMn: match[1].trim(), nameEn: match[2].trim() }
  }
  return { nameMn: trimmed, nameEn: "" }
}

export function splitDescriptionBilingual(description?: string): {
  descriptionMn: string
  descriptionEn: string
} {
  if (!description?.trim()) {
    return { descriptionMn: "", descriptionEn: "" }
  }
  const parts = description.split(" — ").map((p) => p.trim())
  if (parts.length >= 2) {
    return { descriptionMn: parts[0], descriptionEn: parts.slice(1).join(" — ") }
  }
  return { descriptionMn: description.trim(), descriptionEn: "" }
}

function inferEnglishSizeLabel(labelMn: string): string {
  const n = labelMn.trim().toLowerCase()
  if (/^1\s*[-–]?\s*2\s*хүн/.test(n) || /^1-2\s*хүн/.test(n)) return "1-2 people"
  const match = n.match(/^(\d+)\s*хүн/)
  if (match) {
    const num = Number.parseInt(match[1], 10)
    if (Number.isFinite(num) && num >= 1) {
      return num === 1 ? "1 person" : `${num} people`
    }
  }
  return ""
}

/** Stored cart/order portion labels (MN-only DB values → EN display). */
export function resolveStoredPortionLabel(
  labelMn: string | undefined,
  labelEn: string | undefined,
  locale: MenuLocale
): string | null {
  const mn = labelMn?.trim() ?? ""
  const en = labelEn?.trim() ?? ""
  if (!mn && !en) return null
  if (locale === "en") {
    return en || inferEnglishSizeLabel(mn) || mn || null
  }
  return mn || en || null
}

export function normalizeMenuSize(
  raw: Partial<MenuSizeOption> & Partial<BilingualMenuSize>
): BilingualMenuSize | null {
  const price = Number(raw.price)
  if (!Number.isFinite(price) || price < 0) return null

  const labelMn = String(raw.labelMn ?? raw.label ?? "").trim()
  const labelEn = String(raw.labelEn ?? "").trim()

  if (!labelMn && !labelEn) return null

  const canonicalMn = labelMn || labelEn
  const canonicalEn = labelEn

  return {
    labelMn: canonicalMn,
    labelEn: canonicalEn,
    price,
    label: raw.label?.trim() || canonicalMn,
  }
}

export function normalizeMenuSizes(
  sizes: RawMenu["sizes"]
): BilingualMenuSize[] | undefined {
  if (!sizes?.length) return undefined
  const normalized = sizes
    .map((s) => normalizeMenuSize(s))
    .filter((s): s is BilingualMenuSize => s != null)
  return normalized.length > 0 ? normalized : undefined
}

export function buildTitleFromNames(nameMn: string, nameEn: string): string {
  const mn = nameMn.trim()
  const en = nameEn.trim()
  if (mn && en) return `${mn} (${en})`
  return mn || en
}

export function buildDescriptionFromBilingual(
  descriptionMn: string,
  descriptionEn: string
): string | undefined {
  const mn = descriptionMn.trim()
  const en = descriptionEn.trim()
  if (mn && en) return `${mn} — ${en}`
  return mn || en || undefined
}

export function resolveMenuPrice(
  price: number,
  sizes?: BilingualMenuSize[]
): number {
  if (sizes?.length) {
    return Math.min(...sizes.map((s) => s.price))
  }
  return price
}

/** Read legacy + new DB fields into canonical bilingual shape. */
export function normalizeMenuDocument<T extends RawMenu>(
  doc: T
): T & BilingualMenuFields {
  const fromTitle = parseTitleBilingual(String(doc.title ?? ""))
  const fromDesc = splitDescriptionBilingual(doc.description)

  const nameMn =
    String(doc.nameMn ?? doc.nameMongolian ?? "").trim() || fromTitle.nameMn
  const nameEn =
    String(doc.nameEn ?? doc.nameEnglish ?? "").trim() || fromTitle.nameEn
  const descriptionMn =
    String(doc.descriptionMn ?? doc.descriptionMongolian ?? "").trim() ||
    fromDesc.descriptionMn
  const descriptionEn =
    String(doc.descriptionEn ?? doc.descriptionEnglish ?? "").trim() ||
    fromDesc.descriptionEn

  const sizes = normalizeMenuSizes(doc.sizes)
  const price = resolveMenuPrice(Number(doc.price ?? 0), sizes)

  return {
    ...doc,
    nameMn,
    nameEn,
    descriptionMn,
    descriptionEn,
    title: buildTitleFromNames(nameMn, nameEn),
    description: buildDescriptionFromBilingual(descriptionMn, descriptionEn),
    sizes,
    price,
  }
}

export function resolveMenuName(
  item: Pick<
    BilingualMenuFields,
    "nameMn" | "nameEn" | "title"
  >,
  locale: MenuLocale
): string {
  if (locale === "en") {
    return item.nameEn.trim() || item.nameMn.trim() || item.title
  }
  return item.nameMn.trim() || item.nameEn.trim() || item.title
}

export function resolveMenuDescription(
  item: Pick<BilingualMenuFields, "descriptionMn" | "descriptionEn" | "description">,
  locale: MenuLocale
): string {
  if (locale === "en") {
    return (
      item.descriptionEn.trim() ||
      item.descriptionMn.trim() ||
      item.description?.trim() ||
      ""
    )
  }
  return (
    item.descriptionMn.trim() ||
    item.descriptionEn.trim() ||
    item.description?.trim() ||
    ""
  )
}

export function resolveSizeLabel(
  size: BilingualMenuSize,
  locale: MenuLocale
): string {
  const mn = (size.labelMn ?? size.label ?? "").trim()
  let en = (size.labelEn ?? "").trim()
  if (!en && locale === "en" && mn) {
    en = inferEnglishSizeLabel(mn)
  }
  if (locale === "en") {
    return en || mn
  }
  return mn || en
}

export function menuHasSizes(
  item: Pick<BilingualMenuFields, "sizes">
): boolean {
  return Boolean(item.sizes?.length)
}

export function checkoutLineKey(item: {
  _id: string
  price: number
  selectedSizeLabelMn?: string
  selectedSizeLabelEn?: string
}): string {
  const smn = item.selectedSizeLabelMn ?? ""
  const sen = item.selectedSizeLabelEn ?? ""
  return `${item._id}::${smn}::${sen}::${item.price}`
}

export type OrderItemDisplay = {
  title: string
  nameMn?: string
  nameEn?: string
  selectedSizeLabelMn?: string
  selectedSizeLabelEn?: string
}

export function resolveOrderItemDisplay(
  item: OrderItemDisplay,
  locale: MenuLocale
): { name: string; sizeLabel?: string } {
  const name =
    locale === "en"
      ? (item.nameEn?.trim() ||
          item.nameMn?.trim() ||
          item.title)
      : (item.nameMn?.trim() ||
          item.nameEn?.trim() ||
          item.title)

  const sizeLabel =
    locale === "en"
      ? item.selectedSizeLabelEn?.trim() || item.selectedSizeLabelMn?.trim()
      : item.selectedSizeLabelMn?.trim() || item.selectedSizeLabelEn?.trim()

  return {
    name,
    sizeLabel: sizeLabel || undefined,
  }
}

export function formatOrderItemLine(
  item: OrderItemDisplay,
  locale: MenuLocale,
  quantity?: number
): string {
  const { name, sizeLabel } = resolveOrderItemDisplay(item, locale)
  const qtyPrefix =
    quantity != null && quantity > 0 ? `${quantity}× ` : ""
  if (sizeLabel) return `${qtyPrefix}${name} (${sizeLabel})`
  return `${qtyPrefix}${name}`
}

/** Cart subtitle: "2 хүн × 1" or "× 2" when no portion. */
export function formatCartPortionSubtitle(
  item: OrderItemDisplay,
  locale: MenuLocale,
  quantity: number
): string | null {
  const { sizeLabel } = resolveOrderItemDisplay(item, locale)
  if (sizeLabel) return `${sizeLabel} × ${quantity}`
  if (quantity > 1) return `× ${quantity}`
  return null
}

export function formatPortionOptionLabel(
  size: BilingualMenuSize,
  locale: MenuLocale,
  formatPriceFn: (amount: number) => string
): string {
  return `${resolveSizeLabel(size, locale)} — ${formatPriceFn(size.price)}`
}

export function menuNeedsPortionPicker(
  item: Pick<BilingualMenuFields, "sizes">
): boolean {
  return (item.sizes?.length ?? 0) > 1
}

export function buildCheckoutLineFromMenu(
  menu: IMenu,
  size?: BilingualMenuSize
): Omit<IMenu, "quantity"> & {
  cartLineKey: string
  selectedSizeLabelMn?: string
  selectedSizeLabelEn?: string
  itemCount?: number
} {
  const normalized = normalizeMenuDocument(menu)
  const chosen =
    size ?? (normalized.sizes?.length === 1 ? normalized.sizes[0] : undefined)
  const price = resolveOrderLinePrice({
    selectedSize: chosen,
    price: chosen ? undefined : normalized.price,
  })

  const { quantity: _menuStock, ...menuWithoutStock } = normalized

  const line = {
    ...menuWithoutStock,
    price: Number.isFinite(price) && price > 0 ? price : 0,
    selectedSizeLabelMn: chosen?.labelMn,
    selectedSizeLabelEn: chosen?.labelEn,
  }

  return {
    ...line,
    cartLineKey: checkoutLineKey({
      _id: String(menu._id),
      price,
      selectedSizeLabelMn: size?.labelMn,
      selectedSizeLabelEn: size?.labelEn,
    }),
  }
}

export type MenuFormSizeRow = {
  labelMn: string
  labelEn: string
  price: string
}

export function emptySizeRow(): MenuFormSizeRow {
  return { labelMn: "", labelEn: "", price: "" }
}

export function sizesFromFormRows(
  rows: MenuFormSizeRow[]
): BilingualMenuSize[] | undefined {
  const sizes = rows
    .map((row) =>
      normalizeMenuSize({
        labelMn: row.labelMn,
        labelEn: row.labelEn,
        price: Number(row.price),
      })
    )
    .filter((s): s is BilingualMenuSize => s != null)
  return sizes.length > 0 ? sizes : undefined
}

export function sizesToFormRows(
  sizes?: BilingualMenuSize[]
): MenuFormSizeRow[] {
  if (!sizes?.length) return []
  return sizes.map((s) => {
    const mn = (s.labelMn ?? s.label ?? "").trim()
    let en = (s.labelEn ?? "").trim()
    if (en && en === mn) en = ""
    return {
      labelMn: mn,
      labelEn: en,
      price: String(s.price),
    }
  })
}

export function buildMenuDbFields(input: {
  nameMn: string
  nameEn: string
  descriptionMn: string
  descriptionEn: string
  section: string
  price: number
  sizes?: BilingualMenuSize[]
  available: boolean
  spicyLevel: number
}): Record<string, unknown> {
  const nameMn = input.nameMn.trim()
  const nameEn = input.nameEn.trim()
  const descriptionMn = input.descriptionMn.trim()
  const descriptionEn = input.descriptionEn.trim()
  const sizes = input.sizes
  const price = resolveMenuPrice(input.price, sizes)

  return {
    nameMn,
    nameEn,
    descriptionMn,
    descriptionEn,
    nameMongolian: nameMn,
    nameEnglish: nameEn,
    descriptionMongolian: descriptionMn,
    descriptionEnglish: descriptionEn,
    title: buildTitleFromNames(nameMn, nameEn),
    description: buildDescriptionFromBilingual(descriptionMn, descriptionEn),
    section: input.section.trim(),
    price,
    sizes: sizes?.map((s) => ({
      labelMn: s.labelMn,
      labelEn: s.labelEn || undefined,
      label: s.labelMn || s.labelEn || s.label,
      price: s.price,
    })),
    available: input.available,
  }
}

export function parseSizesJson(raw: unknown): BilingualMenuSize[] | undefined {
  if (raw == null || raw === "") return undefined
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return undefined
    return normalizeMenuSizes(parsed)
  } catch {
    return undefined
  }
}

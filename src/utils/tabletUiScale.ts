import type { CSSProperties } from "react"

export const TABLET_UI_SCALE_OPTIONS = [1, 1.25, 1.5, 1.75] as const
export type TabletUiScale = number

export const UI_SCALE_PERCENT_MIN = 100
export const UI_SCALE_PERCENT_MAX = 175
export const UI_SCALE_PERCENT_STEP = 5

export const TEXT_SCALE_PERCENT_MIN = 100
export const TEXT_SCALE_PERCENT_MAX = 180
export const TEXT_SCALE_PERCENT_STEP = 5

export const DEFAULT_TABLET_UI_SCALE = 1.35
export const DEFAULT_TABLET_TEXT_SCALE = 1.35

export const TABLET_SIDEBAR_WIDTH_PX = 230

const UI_SCALE_ANCHORS = [1, 1.25, 1.5, 1.75] as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

export function uiScaleToPercent(scale: number): number {
  return Math.round(normalizeTabletUiScale(scale) * 100)
}

export function textScaleToPercent(scale: number): number {
  return Math.round(normalizeTabletTextScale(scale) * 100)
}

export function percentToUiScale(percent: number): number {
  return normalizeTabletUiScale(percent)
}

export function percentToTextScale(percent: number): number {
  return normalizeTabletTextScale(percent)
}

export function normalizeTabletUiScale(value: unknown): number {
  let numeric = DEFAULT_TABLET_UI_SCALE

  if (typeof value === "number" && Number.isFinite(value)) {
    numeric = value > 10 ? value / 100 : value
  } else if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      numeric = parsed > 10 ? parsed / 100 : parsed
    }
  }

  const asPercent = numeric * 100
  const steppedPercent = roundToStep(
    clamp(asPercent, UI_SCALE_PERCENT_MIN, UI_SCALE_PERCENT_MAX),
    UI_SCALE_PERCENT_STEP
  )
  return steppedPercent / 100
}

export function normalizeTabletTextScale(value: unknown): number {
  let numeric = DEFAULT_TABLET_TEXT_SCALE

  if (typeof value === "number" && Number.isFinite(value)) {
    numeric = value > 10 ? value / 100 : value
  } else if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      numeric = parsed > 10 ? parsed / 100 : parsed
    }
  }

  const asPercent = numeric * 100
  const steppedPercent = roundToStep(
    clamp(asPercent, TEXT_SCALE_PERCENT_MIN, TEXT_SCALE_PERCENT_MAX),
    TEXT_SCALE_PERCENT_STEP
  )
  return steppedPercent / 100
}

export function tabletUiScaleLabel(scale: number): string {
  return `${uiScaleToPercent(scale)}%`
}

export function tabletTextScaleLabel(scale: number): string {
  return `${textScaleToPercent(scale)}%`
}

export type TabletCardLayoutPreset = {
  columns: number
  imageHeight: number
  minHeight: number
  gap: number
}

export const TABLET_CARD_LAYOUT_BY_SCALE: Record<
  (typeof UI_SCALE_ANCHORS)[number],
  TabletCardLayoutPreset
> = {
  1: { columns: 3, imageHeight: 150, minHeight: 210, gap: 12 },
  1.25: { columns: 3, imageHeight: 170, minHeight: 240, gap: 14 },
  1.5: { columns: 2, imageHeight: 220, minHeight: 310, gap: 18 },
  1.75: { columns: 2, imageHeight: 250, minHeight: 350, gap: 20 },
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function interpolateCardLayout(scale: number): TabletCardLayoutPreset {
  const s = normalizeTabletUiScale(scale)

  if (s <= UI_SCALE_ANCHORS[0]) return TABLET_CARD_LAYOUT_BY_SCALE[1]
  if (s >= UI_SCALE_ANCHORS[UI_SCALE_ANCHORS.length - 1]) {
    return TABLET_CARD_LAYOUT_BY_SCALE[1.75]
  }

  for (let i = 0; i < UI_SCALE_ANCHORS.length - 1; i += 1) {
    const start = UI_SCALE_ANCHORS[i]
    const end = UI_SCALE_ANCHORS[i + 1]
    if (s >= start && s <= end) {
      const t = (s - start) / (end - start)
      const from = TABLET_CARD_LAYOUT_BY_SCALE[start]
      const to = TABLET_CARD_LAYOUT_BY_SCALE[end]
      const columns = s >= 1.375 ? 2 : 3
      return {
        columns,
        imageHeight: Math.round(lerp(from.imageHeight, to.imageHeight, t)),
        minHeight: Math.round(lerp(from.minHeight, to.minHeight, t)),
        gap: Math.round(lerp(from.gap, to.gap, t)),
      }
    }
  }

  return TABLET_CARD_LAYOUT_BY_SCALE[1.5]
}

export function getTabletCardLayoutPreset(scale: number): TabletCardLayoutPreset {
  return interpolateCardLayout(scale)
}

/** Layout + text CSS variables for tablet menu shell and cart drawer. */
export function buildTabletUiCssVars(
  uiScale: number,
  textScale: number = DEFAULT_TABLET_TEXT_SCALE
): CSSProperties {
  const layoutScale = normalizeTabletUiScale(uiScale)
  const textMult = normalizeTabletTextScale(textScale)
  const cardLayout = interpolateCardLayout(layoutScale)

  const textScaleVar = String(textMult)
  const fontSidebar = "calc(16px * var(--tablet-text-scale))"
  const fontFoodName = "calc(16px * var(--tablet-text-scale))"
  const fontPrice = "calc(17px * var(--tablet-text-scale))"
  const fontButton = "calc(15px * var(--tablet-text-scale))"
  const fontCart = "calc(16px * var(--tablet-text-scale))"

  return {
    "--tablet-ui-scale": String(layoutScale),
    "--tablet-text-scale": textScaleVar,
    "--tablet-font-sidebar": fontSidebar,
    "--tablet-font-food-name": fontFoodName,
    "--tablet-font-price": fontPrice,
    "--tablet-font-button": fontButton,
    "--tablet-font-cart": fontCart,
    "--tablet-sidebar-width": `${TABLET_SIDEBAR_WIDTH_PX}px`,
    "--tablet-bottom-bar-height": `${Math.round(56 * layoutScale)}px`,
    "--tablet-brand-logo-size": `${Math.round(43 * layoutScale)}px`,
    "--tablet-brand-area-min-height": `${Math.round(53 * layoutScale)}px`,
    "--tablet-category-height": `${Math.round(40 * layoutScale)}px`,
    "--tablet-category-icon-size": `${Math.round(16 * layoutScale)}px`,
    "--tablet-header-padding": `${Math.round(13 * layoutScale)}px`,
    "--tablet-scroll-padding": `${Math.round(13 * layoutScale)}px`,
    "--tablet-grid-columns": String(cardLayout.columns),
    "--tablet-grid-gap": `${cardLayout.gap}px`,
    "--tablet-card-gap": `${cardLayout.gap}px`,
    "--tablet-card-min-height": `${cardLayout.minHeight}px`,
    "--tablet-card-radius": `${Math.round(11 * layoutScale)}px`,
    "--tablet-card-image-height": `${cardLayout.imageHeight}px`,
    "--tablet-bottom-btn-height": `${Math.round(40 * layoutScale)}px`,
    "--tablet-bottom-icon-size": `${Math.round(15 * layoutScale)}px`,
    "--tablet-staff-call-height": `${Math.round(43 * layoutScale)}px`,
    "--tablet-staff-call-icon-size": `${Math.round(16 * layoutScale)}px`,
    "--tablet-cart-width": `${Math.round(307 * layoutScale)}px`,
    "--tablet-cart-close-size": `${Math.round(32 * layoutScale)}px`,
    "--tablet-cart-item-image-size": `${Math.round(60 * layoutScale)}px`,
    "--tablet-cart-qty-btn-size": `${Math.max(48, Math.round(44 * layoutScale))}px`,
    "--tablet-cart-submit-height": `${Math.max(48, Math.round(48 * layoutScale))}px`,
    "--tablet-font-base": fontSidebar,
    "--tablet-brand-name-size": fontSidebar,
    "--tablet-category-font-size": fontSidebar,
    "--tablet-header-title-size": fontFoodName,
    "--tablet-section-title-size": fontFoodName,
    "--tablet-table-badge-number-size": fontPrice,
    "--tablet-card-name-size": fontFoodName,
    "--tablet-card-price-size": fontPrice,
    "--tablet-bottom-btn-font-size": fontButton,
    "--tablet-staff-call-font-size": fontButton,
    "--tablet-cart-title-size": fontCart,
    "--tablet-cart-item-name-size": "calc(22px * var(--tablet-text-scale))",
    "--tablet-cart-item-price-size": "calc(24px * var(--tablet-text-scale))",
    "--tablet-cart-qty-font-size": "calc(22px * var(--tablet-text-scale))",
    "--tablet-cart-recent-badge-size": "calc(15px * var(--tablet-text-scale))",
    "--tablet-cart-qty-icon-size": "calc(24px * var(--tablet-text-scale))",
    "--tablet-cart-delete-icon-size": "calc(22px * var(--tablet-text-scale))",
    "--tablet-cart-total-label-size": "calc(18px * var(--tablet-text-scale))",
    "--tablet-cart-total-value-size": "calc(28px * var(--tablet-text-scale))",
    "--tablet-cart-submit-font-size": "calc(19px * var(--tablet-text-scale))",
  } as CSSProperties
}

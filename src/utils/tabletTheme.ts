import type { CSSProperties } from "react"
import { buildTabletUiCssVars } from "@/utils/tabletUiScale"

export const TABLET_THEME_IDS = ["dark", "light", "warm", "gold"] as const
export type TabletThemeId = (typeof TABLET_THEME_IDS)[number]

/** @deprecated Legacy id — normalized to `gold` on read */
export const LEGACY_PREMIUM_THEME_ID = "premium"

export const DEFAULT_TABLET_THEME: TabletThemeId = "dark"

export type TabletThemePreset = {
  bg: string
  sidebar: string
  card: string
  surface: string
  border: string
  text: string
  accent: string
  accentLight?: string
  accentDark?: string
  goldShadow?: string
  sidebarCard: string
  sidebarText: string
  sidebarActiveBg: string
  sidebarActiveText: string
  brandText: string
  mutedText: string
  bottomNavBg: string
  btnPrimaryBg: string
  btnPrimaryText: string
  btnSecondaryBg: string
  btnSecondaryText: string
  btnSecondaryBorder: string
  overlay: string
  accentSoft: string
  imageBg: string
  /** Primary action button gradient (Dark theme red) */
  actionGradient?: string
  actionBorder?: string
  actionShadow?: string
  accentHover?: string
}

export const TABLET_THEME_PRESETS: Record<TabletThemeId, TabletThemePreset> = {
  dark: {
    bg: "#202225",
    sidebar: "#1e1f22",
    card: "#2b2d31",
    surface: "#313338",
    border: "#3f4147",
    text: "#e3e5e8",
    accent: "#c62828",
    accentLight: "#d32f2f",
    accentDark: "#8e1b1b",
    accentHover: "#d32f2f",
    actionGradient: "linear-gradient(180deg, #c62828 0%, #a91d1d 100%)",
    actionBorder: "rgba(255, 255, 255, 0.08)",
    actionShadow: "0 4px 16px rgba(198, 40, 40, 0.25)",
    sidebarCard: "#2b2d31",
    sidebarText: "#b5bac1",
    sidebarActiveBg: "#313338",
    sidebarActiveText: "#e3e5e8",
    brandText: "#e3e5e8",
    mutedText: "#b5bac1",
    bottomNavBg: "#202225",
    btnPrimaryBg: "#c62828",
    btnPrimaryText: "#ffffff",
    btnSecondaryBg: "#2b2d31",
    btnSecondaryText: "#e3e5e8",
    btnSecondaryBorder: "#3f4147",
    overlay: "rgba(0, 0, 0, 0.6)",
    accentSoft: "rgba(198, 40, 40, 0.12)",
    imageBg: "#313338",
  },
  light: {
    bg: "#f3f4f6",
    sidebar: "#e5e7eb",
    card: "#ffffff",
    surface: "#ffffff",
    border: "#d1d5db",
    text: "#1f2937",
    accent: "#ef4444",
    sidebarCard: "#ffffff",
    sidebarText: "#374151",
    sidebarActiveBg: "#ffffff",
    sidebarActiveText: "#1f2937",
    brandText: "#1f2937",
    mutedText: "#6b7280",
    bottomNavBg: "#f8f9fa",
    btnPrimaryBg: "#1e293b",
    btnPrimaryText: "#ffffff",
    btnSecondaryBg: "#ffffff",
    btnSecondaryText: "#374151",
    btnSecondaryBorder: "#d1d5db",
    overlay: "rgba(17, 24, 39, 0.4)",
    accentSoft: "#fee2e2",
    imageBg: "#e5e7eb",
  },
  warm: {
    bg: "#efe4d3",
    sidebar: "#3a2a20",
    card: "#f4eadc",
    surface: "#ead9c3",
    border: "#d4bc9f",
    text: "#3a2a20",
    accent: "#b7793c",
    sidebarCard: "#4a3628",
    sidebarText: "#efe4d3",
    sidebarActiveBg: "#efe4d3",
    sidebarActiveText: "#3a2a20",
    brandText: "#f4eadc",
    mutedText: "#8a6849",
    bottomNavBg: "#f4eadc",
    btnPrimaryBg: "#3a2a20",
    btnPrimaryText: "#f4eadc",
    btnSecondaryBg: "#ead9c3",
    btnSecondaryText: "#3a2a20",
    btnSecondaryBorder: "#c9a882",
    overlay: "rgba(58, 42, 32, 0.5)",
    accentSoft: "#e8d4b8",
    imageBg: "#ead9c3",
  },
  gold: {
    bg: "#171717",
    sidebar: "#1e1e1e",
    card: "#252525",
    surface: "#2d2d2d",
    border: "rgba(212, 166, 74, 0.25)",
    text: "#f2efe8",
    accent: "#d4a64a",
    accentLight: "#e4bc69",
    accentDark: "#9d7330",
    goldShadow: "0 4px 16px rgba(212, 166, 74, 0.15)",
    sidebarCard: "#252525",
    sidebarText: "#b8b1a5",
    sidebarActiveBg: "rgba(212, 166, 74, 0.12)",
    sidebarActiveText: "#e4bc69",
    brandText: "#f2efe8",
    mutedText: "#b8b1a5",
    bottomNavBg: "#171717",
    btnPrimaryBg: "#252525",
    btnPrimaryText: "#f2efe8",
    btnSecondaryBg: "#252525",
    btnSecondaryText: "#f2efe8",
    btnSecondaryBorder: "rgba(212, 166, 74, 0.45)",
    overlay: "rgba(0, 0, 0, 0.72)",
    accentSoft: "rgba(212, 166, 74, 0.12)",
    imageBg: "#2d2d2d",
  },
}

export const TABLET_THEME_OPTIONS: {
  id: TabletThemeId
  label: string
  description: string
  previewColors?: [string, string, string, string]
}[] = [
  {
    id: "dark",
    label: "Харанхуй",
    description: "Саарал бараан өнгө, улаан товчтой",
    previewColors: ["#202225", "#2b2d31", "#c62828", "#e3e5e8"],
  },
  {
    id: "light",
    label: "Цайвар",
    description: "Зөөлөн саарал ресторан стиль",
    previewColors: ["#f3f4f6", "#e5e7eb", "#ef4444", "#1f2937"],
  },
  {
    id: "warm",
    label: "Дулаан",
    description: "Кафе маягийн дулаан өнгө",
  },
  {
    id: "gold",
    label: "Алтан",
    description: "Хар алтансаг ресторан стиль",
    previewColors: ["#171717", "#252525", "#d4a64a", "#f2efe8"],
  },
]

export function normalizeTabletTheme(value: unknown): TabletThemeId {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === LEGACY_PREMIUM_THEME_ID) {
      return "gold"
    }
    if (TABLET_THEME_IDS.includes(normalized as TabletThemeId)) {
      return normalized as TabletThemeId
    }
  }
  return DEFAULT_TABLET_THEME
}

export function buildTabletThemeCssVars(
  theme: TabletThemeId = DEFAULT_TABLET_THEME
): CSSProperties {
  const preset = TABLET_THEME_PRESETS[theme]

  return {
    "--tablet-bg": preset.bg,
    "--tablet-sidebar": preset.sidebar,
    "--tablet-card": preset.card,
    "--tablet-surface": preset.surface,
    "--tablet-border": preset.border,
    "--tablet-text": preset.text,
    "--tablet-accent": preset.accent,
    "--tablet-accent-light": preset.accentLight ?? preset.accent,
    "--tablet-accent-dark": preset.accentDark ?? preset.accent,
    "--tablet-gold-shadow": preset.goldShadow ?? "none",
    "--tablet-sidebar-card": preset.sidebarCard,
    "--tablet-sidebar-text": preset.sidebarText,
    "--tablet-sidebar-active-bg": preset.sidebarActiveBg,
    "--tablet-sidebar-active-text": preset.sidebarActiveText,
    "--tablet-brand-text": preset.brandText,
    "--tablet-muted": preset.mutedText,
    "--tablet-bottom-nav-bg": preset.bottomNavBg,
    "--tablet-btn-primary-bg": preset.btnPrimaryBg,
    "--tablet-btn-primary-text": preset.btnPrimaryText,
    "--tablet-btn-secondary-bg": preset.btnSecondaryBg,
    "--tablet-btn-secondary-text": preset.btnSecondaryText,
    "--tablet-btn-secondary-border": preset.btnSecondaryBorder,
    "--tablet-overlay": preset.overlay,
    "--tablet-accent-soft": preset.accentSoft,
    "--tablet-image-bg": preset.imageBg,
    "--tablet-accent-hover": preset.accentHover ?? preset.accentLight ?? preset.accent,
    "--tablet-action-gradient":
      preset.actionGradient ?? preset.btnPrimaryBg,
    "--tablet-action-border": preset.actionBorder ?? preset.border,
    "--tablet-action-shadow": preset.actionShadow ?? "none",
  } as CSSProperties
}

/** Layout, text scale, and theme CSS variables for the tablet menu shell. */
export function buildTabletShellCssVars(
  uiScale: number,
  textScale: number,
  theme: TabletThemeId = DEFAULT_TABLET_THEME
): CSSProperties {
  return {
    ...buildTabletUiCssVars(uiScale, textScale),
    ...buildTabletThemeCssVars(theme),
  }
}

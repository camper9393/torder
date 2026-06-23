"use client"

import { cn } from "@/lib/utils"
import {
  DEFAULT_TABLET_TEXT_SCALE,
  DEFAULT_TABLET_UI_SCALE,
  normalizeTabletTextScale,
  normalizeTabletUiScale,
  textScaleToPercent,
  uiScaleToPercent,
} from "@/utils/tabletUiScale"
import {
  DEFAULT_TABLET_THEME,
  normalizeTabletTheme,
  type TabletThemeId,
  buildTabletShellCssVars,
} from "@/utils/tabletTheme"

type TOrderMenuShellProps = {
  children: React.ReactNode
  className?: string
  uiScale?: number
  textScale?: number
  theme?: TabletThemeId
}

/** Clean Korean t'order-style tablet shell (ordering page only). */
export function TOrderMenuShell({
  children,
  className,
  uiScale = DEFAULT_TABLET_UI_SCALE,
  textScale = DEFAULT_TABLET_TEXT_SCALE,
  theme = DEFAULT_TABLET_THEME,
}: TOrderMenuShellProps) {
  const normalizedUi = normalizeTabletUiScale(uiScale)
  const normalizedText = normalizeTabletTextScale(textScale)
  const normalizedTheme = normalizeTabletTheme(theme)

  return (
    <div
      className={cn("tablet-menu-shell", className)}
      data-tablet-scale={uiScaleToPercent(normalizedUi)}
      data-tablet-text-scale={textScaleToPercent(normalizedText)}
      data-tablet-theme={normalizedTheme}
      style={buildTabletShellCssVars(normalizedUi, normalizedText, normalizedTheme)}
    >
      {children}
    </div>
  )
}

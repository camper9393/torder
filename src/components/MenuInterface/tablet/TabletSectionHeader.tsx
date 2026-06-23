"use client"

import { useLocale } from "@/context/LocaleContext"
import { getCategoryLucideIcon } from "@/utils/categoryIcons"
import type { CategoryIconName } from "@/utils/categoryIcons"

type TabletSectionHeaderProps = {
  id?: string
  label: string
  itemCount: number
  iconName?: CategoryIconName | string
}

function TabletSectionHeader({
  id,
  label,
  itemCount,
  iconName,
}: TabletSectionHeaderProps) {
  const { t } = useLocale()
  const CategoryIcon = getCategoryLucideIcon(iconName)

  return (
    <div className="tablet-menu-section-header">
      <span className="tablet-menu-section-header-accent" aria-hidden />
      <CategoryIcon
        className="tablet-menu-section-header-icon shrink-0"
        aria-hidden
      />
      <div className="tablet-menu-section-header-text min-w-0 flex-1">
        <h2
          id={id}
          className="tablet-menu-section-title tablet-font-food-name tablet-themed-text truncate font-bold leading-tight"
        >
          {label}
        </h2>
        {itemCount > 0 ? (
          <p className="tablet-menu-section-count tablet-font-sidebar tablet-themed-muted mt-0.5">
            {t.tablet.categoryItemCount(itemCount)}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default TabletSectionHeader

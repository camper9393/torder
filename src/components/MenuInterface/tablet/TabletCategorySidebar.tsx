"use client"

import React from "react"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/context/LocaleContext"
import { useWaiterCallSubmit } from "@/hooks/useWaiterCallSubmit"
import { getCategoryLucideIcon } from "@/utils/categoryIcons"
import type { CategoryIconName } from "@/utils/categoryIcons"
import {
  displayTableNumber,
  hasDisplayableTableName,
} from "@/utils/table"

type TabletCategorySidebarProps = {
  restaurantName: string
  categories: string[]
  categoryIcons?: Record<string, CategoryIconName | string>
  getCategoryLabel?: (categoryKey: string) => string
  active: string
  onChange: (category: string) => void
  merchantId: string
  tableName: string
}

function scrollActiveCategoryIntoView(
  button: HTMLButtonElement | null,
  list: HTMLElement | null
) {
  if (!button || !list) return

  const listRect = list.getBoundingClientRect()
  const buttonRect = button.getBoundingClientRect()

  if (buttonRect.top >= listRect.top && buttonRect.bottom <= listRect.bottom) {
    return
  }

  button.scrollIntoView({ block: "nearest", behavior: "auto" })
}

type SidebarCategoryButtonProps = {
  category: string
  label: string
  isActive: boolean
  iconName?: CategoryIconName | string
  onSelect: (category: string) => void
  buttonRef?: React.Ref<HTMLButtonElement>
}

const SidebarCategoryButton = React.memo(function SidebarCategoryButton({
  category,
  label,
  isActive,
  iconName,
  onSelect,
  buttonRef,
}: SidebarCategoryButtonProps) {
  const CategoryIcon = getCategoryLucideIcon(iconName)

  return (
    <li>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => onSelect(category)}
        className={cn(
          "tablet-sidebar-category tablet-font-sidebar relative flex w-full items-center text-left font-bold transition touch-manipulation",
          isActive
            ? "tablet-sidebar-category-active rounded-r-full"
            : "tablet-sidebar-category-inactive"
        )}
      >
        {isActive ? (
          <span
            className="tablet-category-accent-bar absolute left-0 top-1/2 h-10 w-[4px] -translate-y-1/2 rounded-full"
            aria-hidden
          />
        ) : null}
        <CategoryIcon
          className={cn(
            "tablet-sidebar-category-icon shrink-0",
            isActive ? "" : "text-[var(--tablet-sidebar-text)]"
          )}
          aria-hidden
        />
        <span className="truncate leading-snug">{label}</span>
      </button>
    </li>
  )
})

function SidebarBrandHeader({
  restaurantName,
  tableName,
}: {
  restaurantName: string
  tableName?: string
}) {
  const { t } = useLocale()
  const showTable = hasDisplayableTableName(tableName)
  const tableNumber = showTable ? displayTableNumber(tableName!) : ""

  return (
    <div className="tablet-sidebar-brand shrink-0">
      <div className="tablet-sidebar-brand-card">
        <h1 className="tablet-sidebar-brand-name tablet-font-sidebar">
          {restaurantName}
        </h1>
        {showTable ? (
          <p
            className="tablet-sidebar-table-label tabular-nums"
            aria-label={t.tablet.tableAria(tableNumber)}
          >
            {t.tablet.tableAria(tableNumber)}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function TabletCategorySidebar({
  restaurantName,
  categories,
  categoryIcons = {},
  getCategoryLabel,
  active,
  onChange,
  merchantId,
  tableName,
}: TabletCategorySidebarProps) {
  const { t } = useLocale()
  const activeButtonRef = React.useRef<HTMLButtonElement>(null)
  const categoryListRef = React.useRef<HTMLElement>(null)
  const { callingStaff, submitWaiterCall } = useWaiterCallSubmit(
    merchantId,
    tableName
  )

  React.useEffect(() => {
    scrollActiveCategoryIntoView(
      activeButtonRef.current,
      categoryListRef.current
    )
  }, [active])

  const handleCallStaff = () => {
    void submitWaiterCall()
  }

  return (
    <aside className="tablet-menu-sidebar">
      <SidebarBrandHeader restaurantName={restaurantName} tableName={tableName} />

      <nav ref={categoryListRef} className="tablet-sidebar-category-list">
        <ul>
          {categories.map((category) => (
            <SidebarCategoryButton
              key={category}
              category={category}
              label={getCategoryLabel?.(category) ?? category}
              isActive={category === active}
              iconName={categoryIcons[category]}
              onSelect={onChange}
              buttonRef={category === active ? activeButtonRef : undefined}
            />
          ))}
        </ul>
      </nav>

      <div className="tablet-sidebar-staff-call">
        <button
          type="button"
          disabled={callingStaff}
          onClick={handleCallStaff}
          className="tablet-sidebar-call-staff tablet-font-button flex w-full items-center justify-center rounded-xl font-bold transition disabled:opacity-50 touch-manipulation"
        >
          <Bell className="tablet-sidebar-call-staff-icon shrink-0" aria-hidden />
          <span>{t.tablet.callStaff}</span>
        </button>
      </div>
    </aside>
  )
}

export default React.memo(TabletCategorySidebar)
export { SidebarBrandHeader }

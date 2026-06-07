"use client"

import React from "react"
import CategoryTabs from "./CategoryTabs"
import MenuGridItem from "./MenuGridItem"
import TabletBottomNav from "./TabletBottomNav"
import TabletMobileOrderBar from "./TabletMobileOrderBar"
import TabletCategorySidebar, {
  SidebarBrandHeader,
} from "./TabletCategorySidebar"
import TabletContentHeader from "./TabletContentHeader"
import { TOrderMenuShell } from "./TOrderMenuShell"
import {
  MOBILE_ORDER_BAR_HEIGHT_PX,
  sortMenuItems,
  SortOption,
  TORDER_BOTTOM_BAR_HEIGHT_PX,
} from "./tabletUi"
import { useContinuousCategoryScroll } from "./useContinuousCategoryScroll"
import { IMenu } from "@/types/menu"
import { useLocale } from "@/context/LocaleContext"
import TabletCartProvider from "./TabletCartProvider"
import {
  buildSectionMetaFromKeys,
  resolveSectionLabel,
  type SectionMetaMap,
} from "@/utils/sectionMeta"

type TabletMenuLayoutProps = {
  merchantId: string
  restaurantName: string
  tableName: string
  menu: IMenu[]
  sectionIcons?: Record<string, string>
  sectionMeta?: SectionMetaMap
  loading: boolean
}

function categorySectionId(category: string): string {
  return `menu-section-${encodeURIComponent(category)}`
}

function TabletMenuLayout({
  merchantId,
  restaurantName,
  tableName,
  menu,
  sectionIcons = {},
  sectionMeta = {},
  loading,
}: TabletMenuLayoutProps) {
  const { t, locale } = useLocale()
  const [sort, setSort] = React.useState<SortOption>("default")

  const categories = React.useMemo(() => {
    const seen = new Set<string>()
    const list: string[] = []
    for (const item of menu) {
      if (!seen.has(item.section)) {
        seen.add(item.section)
        list.push(item.section)
      }
    }
    return list
  }, [menu])

  const resolvedSectionMeta = React.useMemo(
    () => buildSectionMetaFromKeys(categories, sectionMeta),
    [categories, sectionMeta]
  )

  const getCategoryLabel = React.useCallback(
    (sectionKey: string) =>
      resolveSectionLabel(sectionKey, resolvedSectionMeta, locale),
    [resolvedSectionMeta, locale]
  )

  const groupedSections = React.useMemo(() => {
    return categories
      .map((category) => ({
        category,
        items: sortMenuItems(
          menu.filter((item) => item.section === category),
          sort,
          locale
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [categories, menu, sort, locale])

  const sectionCategories = React.useMemo(
    () => groupedSections.map((section) => section.category),
    [groupedSections]
  )

  const { scrollRef, activeCategory, setSectionRef, scrollToCategory } =
    useContinuousCategoryScroll({ categories: sectionCategories })

  const activeCategoryLabel = activeCategory
    ? getCategoryLabel(activeCategory)
    : t.nav.menu

  const bottomPadDesktop = `calc(${TORDER_BOTTOM_BAR_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + 16px)`
  const bottomPadMobile = `calc(${TORDER_BOTTOM_BAR_HEIGHT_PX}px + ${MOBILE_ORDER_BAR_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + 16px)`

  return (
    <TabletCartProvider merchantId={merchantId}>
    <TOrderMenuShell className="flex h-[100dvh] flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <TabletCategorySidebar
          restaurantName={restaurantName}
          categories={sectionCategories}
          categoryIcons={sectionIcons}
          getCategoryLabel={getCategoryLabel}
          active={activeCategory}
          onChange={scrollToCategory}
          merchantId={merchantId}
          tableName={tableName}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 bg-black md:hidden">
            <SidebarBrandHeader restaurantName={restaurantName} />
            <CategoryTabs
              categories={sectionCategories}
              categoryIcons={sectionIcons}
              getCategoryLabel={getCategoryLabel}
              active={activeCategory}
              onChange={scrollToCategory}
              variant="torder"
            />
          </div>

          <TabletContentHeader
            category={activeCategoryLabel}
            tableName={tableName}
            sort={sort}
            onSortChange={setSort}
          />

          <main
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto bg-neutral-50 px-3 py-1.5 md:px-5 md:py-2 max-md:pb-[var(--menu-scroll-pad-mobile)] md:pb-[var(--menu-scroll-pad-desktop)]"
            style={
              {
                "--menu-scroll-pad-mobile": bottomPadMobile,
                "--menu-scroll-pad-desktop": bottomPadDesktop,
              } as React.CSSProperties
            }
          >
            {loading ? (
              <p className="py-16 text-center text-neutral-400">
                {t.tablet.loadingMenu}
              </p>
            ) : groupedSections.length === 0 ? (
              <div className="py-16 text-center text-neutral-400">
                {t.tablet.noCategoryItems}
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                {groupedSections.map((section, sectionIndex) => (
                  <section
                    key={section.category}
                    id={categorySectionId(section.category)}
                    ref={setSectionRef(section.category)}
                    data-category={section.category}
                    aria-labelledby={`${categorySectionId(section.category)}-title`}
                  >
                    <h2
                      id={`${categorySectionId(section.category)}-title`}
                      className="mb-2.5 text-lg font-extrabold text-[#e53935] md:mb-3 md:text-xl"
                    >
                      {getCategoryLabel(section.category)}
                    </h2>
                    <div className="grid grid-cols-2 gap-x-2.5 gap-y-2 sm:grid-cols-2 md:grid-cols-3 md:gap-x-3.5 md:gap-y-2.5 lg:grid-cols-3">
                      {section.items.map((item, index) => (
                        <MenuGridItem
                          key={String(item._id)}
                          item={item}
                          itemNumber={sectionIndex * 1000 + index + 1}
                          variant="torder"
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </main>
        </div>

      </div>

      <TabletMobileOrderBar merchantId={merchantId} variant="torder" />

      <TabletBottomNav
        merchantId={merchantId}
        active="menu"
        variant="torder"
      />

    </TOrderMenuShell>
    </TabletCartProvider>
  )
}

export default TabletMenuLayout

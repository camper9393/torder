"use client"

import React from "react"
import CategoryTabs from "./CategoryTabs"
import MenuGridItem from "./MenuGridItem"
import TabletBottomNav from "./TabletBottomNav"
import TabletMobileOrderBar from "./TabletMobileOrderBar"
import TabletCategorySidebar, {
  SidebarBrandHeader,
} from "./TabletCategorySidebar"
import TabletSectionHeader from "./TabletSectionHeader"
import { TOrderMenuShell } from "./TOrderMenuShell"
import { sortMenuItems, SortOption } from "./tabletUi"
import { useContinuousCategoryScroll } from "./useContinuousCategoryScroll"
import { useTabletMenuPageLock } from "./useTabletMenuPageLock"
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
  uiScale?: number
  textScale?: number
  theme?: TabletThemeId
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
  uiScale,
  textScale,
  theme,
}: TabletMenuLayoutProps) {
  const { t, locale } = useLocale()
  const [sort, setSort] = React.useState<SortOption>("default")

  useTabletMenuPageLock()

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

  return (
    <TabletCartProvider
      merchantId={merchantId}
      uiScale={uiScale}
      textScale={textScale}
      theme={theme}
    >
      <TOrderMenuShell uiScale={uiScale} textScale={textScale} theme={theme}>
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

        <div className="tablet-menu-content">
          <div className="tablet-mobile-category-bar shrink-0 md:hidden">
            <SidebarBrandHeader
              restaurantName={restaurantName}
              tableName={tableName}
            />
            <CategoryTabs
              categories={sectionCategories}
              categoryIcons={sectionIcons}
              getCategoryLabel={getCategoryLabel}
              active={activeCategory}
              onChange={scrollToCategory}
              variant="torder"
            />
          </div>

          <main
            ref={scrollRef}
            className="tablet-menu-scroll tablet-themed-scroll"
          >
            {loading ? (
              <p className="tablet-themed-muted py-16 text-center">
                {t.tablet.loadingMenu}
              </p>
            ) : groupedSections.length === 0 ? (
              <div className="tablet-themed-muted py-16 text-center">
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
                    <TabletSectionHeader
                      id={`${categorySectionId(section.category)}-title`}
                      label={getCategoryLabel(section.category)}
                      itemCount={section.items.length}
                      iconName={sectionIcons[section.category]}
                    />
                    <div className="tablet-menu-grid">
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

          <TabletMobileOrderBar merchantId={merchantId} variant="torder" />

          <TabletBottomNav
            merchantId={merchantId}
            active="menu"
            variant="torder"
          />
        </div>
      </TOrderMenuShell>
    </TabletCartProvider>
  )
}

export default TabletMenuLayout

"use client"

import React from "react"
import FullscreenButton from "../FullscreenButton"
import CategoryTabs from "./CategoryTabs"
import MenuGridItem from "./MenuGridItem"
import SectionToolbar from "./SectionToolbar"
import TabletBottomNav from "./TabletBottomNav"
import TabletHeader from "./TabletHeader"
import {
  sortMenuItems,
  SortOption,
  TABLET_BG,
  TabletLocale,
} from "./tabletUi"
import { IMenu } from "@/types/menu"

type TabletMenuLayoutProps = {
  merchantId: string
  restaurantName: string
  tableName: string
  menu: IMenu[]
  loading: boolean
}

function TabletMenuLayout({
  merchantId,
  restaurantName,
  tableName,
  menu,
  loading,
}: TabletMenuLayoutProps) {
  const [locale, setLocale] = React.useState<TabletLocale>("en")
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

  const [activeCategory, setActiveCategory] = React.useState("")

  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0])
    }
  }, [categories, activeCategory])

  const filteredItems = React.useMemo(() => {
    const inSection = menu.filter((item) => item.section === activeCategory)
    return sortMenuItems(inSection, sort)
  }, [menu, activeCategory, sort])

  const toggleLocale = () =>
    setLocale((prev) => (prev === "en" ? "ko" : "en"))

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: TABLET_BG }}
    >
      <TabletHeader
        restaurantName={restaurantName}
        tableName={tableName}
        merchantId={merchantId}
        locale={locale}
        onToggleLocale={toggleLocale}
      />

      <CategoryTabs
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28">
        {loading ? (
          <p className="py-16 text-center text-gray-500">Loading menu...</p>
        ) : (
          <>
            <SectionToolbar
              category={activeCategory || "Menu"}
              locale={locale}
              sort={sort}
              onSortChange={setSort}
            />

            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
                No items in this category
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filteredItems.map((item) => (
                  <MenuGridItem key={String(item._id)} item={item} locale={locale} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <TabletBottomNav merchantId={merchantId} locale={locale} active="menu" />
      <FullscreenButton className="!top-[5.5rem] !right-3 !z-50 !px-3 !py-2 !text-xs" />
    </div>
  )
}

export default TabletMenuLayout

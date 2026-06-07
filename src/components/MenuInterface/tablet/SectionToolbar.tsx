"use client"

import { useLocale } from "@/context/LocaleContext"
import { sectionDescription, SortOption } from "./tabletUi"

type SectionToolbarProps = {
  category: string
  sort: SortOption
  onSortChange: (sort: SortOption) => void
}

function SectionToolbar({
  category,
  sort,
  onSortChange,
}: SectionToolbarProps) {
  const { t, locale } = useLocale()

  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 pt-4">
      <div className="min-w-0 flex-1">
        <h2 className="font-serif text-2xl font-bold tracking-wide text-[#e8d4a8]">
          {category}
        </h2>
        <p className="mt-1 text-sm text-[#8a7344]">
          {sectionDescription(category, locale)}
        </p>
      </div>

      <label className="flex shrink-0 flex-col gap-1">
        <span className="sr-only">{t.tablet.sortBy}</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="min-h-11 min-w-[10.5rem] rounded-xl border border-[#c9a227]/35 bg-[#1c1916] px-3 text-sm font-medium text-[#e8d4a8] shadow-sm outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/25 touch-manipulation"
        >
          <option value="default">{t.tablet.sortDefault}</option>
          <option value="price-asc">{t.tablet.sortPriceAsc}</option>
          <option value="price-desc">{t.tablet.sortPriceDesc}</option>
          <option value="name">{t.tablet.sortName}</option>
        </select>
      </label>
    </div>
  )
}

export default SectionToolbar

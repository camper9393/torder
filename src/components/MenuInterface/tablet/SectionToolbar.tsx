"use client"

import { sectionDescription, SortOption, tabletCopy, TabletLocale } from "./tabletUi"

type SectionToolbarProps = {
  category: string
  locale: TabletLocale
  sort: SortOption
  onSortChange: (sort: SortOption) => void
}

function SectionToolbar({
  category,
  locale,
  sort,
  onSortChange,
}: SectionToolbarProps) {
  const copy = tabletCopy[locale]

  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 pt-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold text-gray-900">{category}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {sectionDescription(category, locale)}
        </p>
      </div>

      <label className="flex shrink-0 flex-col gap-1">
        <span className="sr-only">Sort</span>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="min-h-11 min-w-[10.5rem] rounded-xl border border-[#c5d4f5] bg-white px-3 text-sm font-medium text-gray-800 shadow-sm outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/20 touch-manipulation"
        >
          <option value="default">{copy.sortDefault}</option>
          <option value="price-asc">{copy.sortPriceAsc}</option>
          <option value="price-desc">{copy.sortPriceDesc}</option>
          <option value="name">{copy.sortName}</option>
        </select>
      </label>
    </div>
  )
}

export default SectionToolbar

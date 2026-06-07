"use client"

import { useLocale } from "@/context/LocaleContext"
import { SortOption } from "./tabletUi"

type TabletContentHeaderProps = {
  category: string
  tableName: string
  sort: SortOption
  onSortChange: (sort: SortOption) => void
}

function displayTableNumber(tableName: string): string {
  const trimmed = tableName.trim()
  if (!trimmed) return "—"
  if (/^\d+$/.test(trimmed)) return trimmed
  const match = trimmed.match(/\d+/)
  if (match) return match[0]
  return trimmed.toUpperCase()
}

function TabletTableTab({ tableName }: { tableName: string }) {
  const { t } = useLocale()
  const tableNumber = displayTableNumber(tableName)

  return (
    <div
      className="flex min-w-[2.75rem] shrink-0 flex-col bg-[#e53935] px-1.5 pb-2 pt-1 text-white rounded-b-xl md:min-w-[3rem] md:rounded-b-2xl md:px-2 md:pb-2.5"
      aria-label={t.tablet.tableAria(tableNumber)}
    >
      <p className="text-left text-[8px] font-bold leading-none tracking-tight md:text-[9px]">
        {t.tablet.tableShort}
      </p>
      <p className="flex min-h-[1.35rem] items-center justify-center pt-0.5 text-lg font-black leading-none tabular-nums md:min-h-[1.5rem] md:text-xl">
        {tableNumber}
      </p>
    </div>
  )
}

function TabletContentHeader({
  category,
  tableName,
}: TabletContentHeaderProps) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-3 bg-white px-4 md:gap-4 md:px-8">
      <h1 className="min-w-0 flex-1 truncate py-3 text-xl font-extrabold text-[#e53935] md:py-3.5 md:text-[1.65rem]">
        {category}
      </h1>
      <TabletTableTab tableName={tableName} />
    </header>
  )
}

export default TabletContentHeader

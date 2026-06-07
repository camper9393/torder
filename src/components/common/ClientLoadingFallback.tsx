"use client"

import { useLocale } from "@/context/LocaleContext"

export function ClientMenuLoading() {
  const { t } = useLocale()
  return (
    <div className="min-h-screen bg-[#E8EDF5] pt-24 text-center text-gray-600">
      {t.tablet.loadingMenu}
    </div>
  )
}

export function ClientPageLoading() {
  const { t } = useLocale()
  return (
    <div className="px-6 pt-20 text-center text-gray-600">{t.common.loading}</div>
  )
}

"use client"

import React from "react"
import CheckOutItem from "./CheckOutItem"
import FullscreenButton from "@/components/MenuInterface/FullscreenButton"
import TabletBottomNav from "@/components/MenuInterface/tablet/TabletBottomNav"
import TabletHeader from "@/components/MenuInterface/tablet/TabletHeader"
import { tabletCopy, TABLET_BG, TabletLocale } from "@/components/MenuInterface/tablet/tabletUi"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

type TabletCheckoutLayoutProps = {
  merchantId: string
  restaurantName: string
  tableName: string
  itemCount: number
  discountedTotal: number
  originalTotal: number
  savings: number
  submitting: boolean
  onPlaceOrder: () => void
  children: React.ReactNode
}

function TabletCheckoutLayout({
  merchantId,
  restaurantName,
  tableName,
  discountedTotal,
  originalTotal,
  savings,
  submitting,
  onPlaceOrder,
  children,
}: TabletCheckoutLayoutProps) {
  const router = useRouter()
  const [locale, setLocale] = React.useState<TabletLocale>("en")
  const copy = tabletCopy[locale]
  const tableQuery = `?table=${encodeURIComponent(tableName)}`

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: TABLET_BG }}>
      <TabletHeader
        restaurantName={restaurantName}
        tableName={tableName}
        merchantId={merchantId}
        locale={locale}
        onToggleLocale={() => setLocale((p) => (p === "en" ? "ko" : "en"))}
      />

      <div className="border-b border-[#d4ddf0] bg-white px-4 py-3">
        <button
          type="button"
          onClick={() =>
            router.push(`/consumer/${merchantId}${tableQuery}`)
          }
          className="flex min-h-11 items-center gap-2 text-sm font-semibold text-[#1E5EFF] touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
          {copy.backToMenu}
        </button>
        <h1 className="mt-1 text-xl font-bold text-gray-900">{copy.checkout}</h1>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 pb-44">
        <div className="flex flex-col gap-3">{children}</div>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="line-through">₹{originalTotal}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#1E5EFF]">
              <span>Total</span>
              <span>₹{discountedTotal}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-xs text-emerald-600">
                <span>Savings</span>
                <span>₹{savings}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={submitting}
            className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#1E5EFF] text-base font-bold text-white shadow-lg active:bg-[#1548D4] disabled:opacity-60 touch-manipulation"
          >
            {submitting
              ? "..."
              : `${copy.placeOrder} · ₹${discountedTotal}`}
          </button>
        </div>
      </main>

      <TabletBottomNav
        merchantId={merchantId}
        locale={locale}
        active="checkout"
      />
      <FullscreenButton className="!top-[5.5rem] !right-3 !z-50 !px-3 !py-2 !text-xs" />
    </div>
  )
}

export default TabletCheckoutLayout

"use client"

import React from "react"
import FullscreenButton from "@/components/MenuInterface/FullscreenButton"
import { PaperMenuShell } from "@/components/MenuInterface/tablet/PaperMenuShell"
import TabletBottomNav from "@/components/MenuInterface/tablet/TabletBottomNav"
import TabletHeader from "@/components/MenuInterface/tablet/TabletHeader"
import { PAPER_MENU_ASSETS } from "@/components/MenuInterface/tablet/paperMenuAssets"
import { formatPrice } from "@/utils/currency"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useLocale } from "@/context/LocaleContext"

type TabletCheckoutLayoutProps = {
  merchantId: string
  restaurantName: string
  tableName: string
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
  const { t } = useLocale()

  const tableQuery = `?table=${encodeURIComponent(tableName)}`

  return (
    <PaperMenuShell>
      <TabletHeader
        restaurantName={restaurantName}
        tableName={tableName}
        merchantId={merchantId}
      />

      <div className="relative border-b border-[#c9a227]/25 bg-[#1a1714]/80 px-4 py-3">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2 opacity-40"
          style={{
            backgroundImage: `url(${PAPER_MENU_ASSETS.waveBorder})`,
            backgroundSize: "auto 100%",
            backgroundRepeat: "repeat-x",
          }}
          aria-hidden
        />
        <button
          type="button"
          onClick={() =>
            router.push(`/consumer/${merchantId}${tableQuery}`)
          }
          className="relative flex min-h-11 items-center gap-2 text-sm font-semibold text-[#c9a227] touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
          {t.tablet.backToMenu}
        </button>
        <h1 className="relative mt-1 font-serif text-xl font-bold text-[#e8d4a8]">
          {t.tablet.checkout}
        </h1>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4 pb-44">
        <div className="flex flex-col gap-3">{children}</div>

        <div className="mt-6 rounded-2xl border border-[#c9a227]/30 bg-[#1c1916]/90 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[#8a7344]">
              <span>{t.common.subtotal}</span>
              <span className="line-through">{formatPrice(originalTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#c9a227]">
              <span>{t.common.total}</span>
              <span>{formatPrice(discountedTotal)}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-xs text-emerald-500/90">
                <span>{t.common.savings}</span>
                <span>{formatPrice(savings)}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onPlaceOrder}
            disabled={submitting}
            className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl border border-[#c9a227] bg-gradient-to-b from-[#c9a227] to-[#8a7344] text-base font-bold text-[#121110] shadow-[0_4px_20px_rgba(201,162,39,0.35)] active:scale-[0.98] disabled:opacity-60 touch-manipulation"
          >
            {submitting
              ? t.tablet.placingOrder
              : `${t.tablet.placeOrder} · ${formatPrice(discountedTotal)}`}
          </button>
        </div>
      </main>

      <TabletBottomNav merchantId={merchantId} active="checkout" />

      <FullscreenButton className="!top-[5.5rem] !right-3 !z-50 !border-[#c9a227]/40 !bg-[#1c1916]/95 !px-3 !py-2 !text-xs !text-[#e8d4a8]" />
    </PaperMenuShell>
  )
}

export default TabletCheckoutLayout

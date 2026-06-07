"use client"

import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/context/LocaleContext"

type TabletOrderSuccessModalProps = {
  open: boolean
  onConfirm: () => void
}

function TabletOrderSuccessModal({
  open,
  onConfirm,
}: TabletOrderSuccessModalProps) {
  const { t } = useLocale()

  if (typeof document === "undefined" || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-[420px] flex-col items-center rounded-2xl bg-[#121212] px-6 py-10 text-center text-white shadow-2xl"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-400">
          ✓
        </div>
        <p className="text-xl font-bold leading-snug md:text-2xl">
          {t.tablet.orderSuccessTitle}
        </p>
        <Button
          type="button"
          onClick={onConfirm}
          className="mt-8 min-h-12 w-full rounded-xl bg-white text-base font-bold text-slate-900 hover:bg-slate-100 touch-manipulation"
        >
          {t.tablet.confirm}
        </Button>
      </div>
    </div>,
    document.body
  )
}

export default TabletOrderSuccessModal

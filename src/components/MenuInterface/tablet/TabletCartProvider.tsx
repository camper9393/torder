"use client"

import React from "react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/hook/redux"
import { clearCheckout } from "@/store/reducer/checkout"
import type { CheckOutItems } from "@/store/reducer/checkout"
import { checkoutLineKey } from "@/utils/menuBilingual"
import { useLocale } from "@/context/LocaleContext"
import TabletCartDrawer from "./TabletCartDrawer"
import TabletOrderConfirmModal from "./TabletOrderConfirmModal"
import TabletOrderSuccessModal from "./TabletOrderSuccessModal"
import TabletOrderHistoryModal from "./TabletOrderHistoryModal"
import { useTabletPlaceOrder } from "./useTabletPlaceOrder"
import { TabletCartContext } from "./useTabletCartUi"
import { DEFAULT_TABLET_TEXT_SCALE, DEFAULT_TABLET_UI_SCALE } from "@/utils/tabletUiScale"
import { DEFAULT_TABLET_THEME, type TabletThemeId } from "@/utils/tabletTheme"

type TabletCartProviderProps = {
  merchantId: string
  children: React.ReactNode
  uiScale?: number
  textScale?: number
  theme?: TabletThemeId
}

function TabletCartProvider({
  merchantId,
  children,
  uiScale = DEFAULT_TABLET_UI_SCALE,
  textScale = DEFAULT_TABLET_TEXT_SCALE,
  theme = DEFAULT_TABLET_THEME,
}: TabletCartProviderProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { t } = useLocale()
  const tableName = useAppSelector((state) => state.checkOut.tableName)
  const { submitOrder, submitting } = useTabletPlaceOrder(merchantId)

  const [open, setOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [successOpen, setSuccessOpen] = React.useState(false)
  const [recentLineKey, setRecentLineKey] = React.useState<string | null>(null)
  const recentTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const clearRecentTimer = () => {
    if (recentTimerRef.current) {
      clearTimeout(recentTimerRef.current)
      recentTimerRef.current = null
    }
  }

  React.useEffect(() => () => clearRecentTimer(), [])

  const notifyItemAdded = React.useCallback(
    (line: CheckOutItems, displayName: string) => {
      const key = checkoutLineKey(line)
      setRecentLineKey(key)
      clearRecentTimer()
      recentTimerRef.current = setTimeout(() => {
        setRecentLineKey((prev) => (prev === key ? null : prev))
      }, 5000)

      toast.success(t.tablet.addedToCart(displayName), {
        duration: 2000,
        position: "top-center",
      })
    },
    [t.tablet]
  )

  const openOrderConfirm = React.useCallback(() => {
    setConfirmOpen(true)
  }, [])

  const handleConfirmSubmit = React.useCallback(async () => {
    const ok = await submitOrder()
    if (!ok) return

    setConfirmOpen(false)
    setOpen(false)
    setSuccessOpen(true)
  }, [submitOrder])

  const handleSuccessAcknowledge = React.useCallback(() => {
    dispatch(clearCheckout())
    setSuccessOpen(false)
    setRecentLineKey(null)
    const tableQuery = tableName
      ? `?table=${encodeURIComponent(tableName)}`
      : ""
    router.push(`/consumer/${merchantId}${tableQuery}`)
  }, [dispatch, merchantId, router, tableName])

  const value = React.useMemo(
    () => ({
      open,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      historyOpen,
      openHistory: () => setHistoryOpen(true),
      closeHistory: () => setHistoryOpen(false),
      recentLineKey,
      notifyItemAdded,
      openOrderConfirm,
      uiScale,
      textScale,
      theme,
    }),
    [open, historyOpen, recentLineKey, notifyItemAdded, openOrderConfirm, uiScale, textScale, theme]
  )

  return (
    <TabletCartContext.Provider value={value}>
      {children}
      <TabletCartDrawer
        merchantId={merchantId}
        uiScale={uiScale}
        textScale={textScale}
        theme={theme}
      />
      <TabletOrderConfirmModal
        open={confirmOpen}
        submitting={submitting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
      />
      <TabletOrderSuccessModal
        open={successOpen}
        onConfirm={handleSuccessAcknowledge}
      />
      <TabletOrderHistoryModal
        open={historyOpen}
        merchantId={merchantId}
        tableName={tableName}
        onClose={() => setHistoryOpen(false)}
      />
    </TabletCartContext.Provider>
  )
}

export default TabletCartProvider

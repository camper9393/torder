"use client"

import React from "react"
import TabletMenuLayout from "./tablet/TabletMenuLayout"
import { getApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import { CONSUMER_MENU } from "@/utils/APIConstant"
import { IMenu } from "@/types/menu"
import { setTableName, syncCartToCheckOut } from "@/store/reducer/checkout"
import { useAppDispatch, useAppSelector } from "@/hook/redux"
import { useSearchParams } from "next/navigation"
import { parseTableFromSearchParam } from "@/utils/table"
import { useLocale } from "@/context/LocaleContext"
import type { SectionMetaMap } from "@/utils/sectionMeta"
import {
  DEFAULT_TABLET_TEXT_SCALE,
  DEFAULT_TABLET_UI_SCALE,
  normalizeTabletTextScale,
  normalizeTabletUiScale,
} from "@/utils/tabletUiScale"
import {
  DEFAULT_TABLET_THEME,
  normalizeTabletTheme,
  type TabletThemeId,
} from "@/utils/tabletTheme"
import { subscribeRestaurantInfoUpdated } from "@/utils/restaurantInfoRefresh"

type ConsumerMenuPayload = {
  menu: IMenu[]
  restaurantName: string
  sectionIcons?: Record<string, string>
  sectionMeta?: SectionMetaMap
  tabletUiScale?: number
  tabletTextScale?: number
  tabletTheme?: TabletThemeId
  uiScale?: number
  textScale?: number
  theme?: TabletThemeId
}

function isValidMerchantId(value: string | null | undefined): boolean {
  if (!value || value === "undefined" || value === "test") return false
  return /^[a-f\d]{24}$/i.test(value)
}

function MerchantPage({
  merchantId,
  initialTableName,
}: {
  merchantId: string
  initialTableName?: string
}) {
  const [menu, setMenu] = React.useState<IMenu[]>([])
  const [sectionIcons, setSectionIcons] = React.useState<
    Record<string, string>
  >({})
  const [sectionMeta, setSectionMeta] = React.useState<SectionMetaMap>({})
  const { t } = useLocale()
  const [restaurantName, setRestaurantName] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [tabletUiScale, setTabletUiScale] = React.useState(DEFAULT_TABLET_UI_SCALE)
  const [tabletTextScale, setTabletTextScale] = React.useState(
    DEFAULT_TABLET_TEXT_SCALE
  )
  const [tabletTheme, setTabletTheme] = React.useState<TabletThemeId>(
    DEFAULT_TABLET_THEME
  )
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const tableName = useAppSelector((state) => state.checkOut.tableName)
  const userId = useAppSelector((state) => state.merchant).merchant?._id

  const previewMode = searchParams.get("preview") === "true"
  const urlScaleParam = searchParams.get("uiScale")
  const urlTextScaleParam = searchParams.get("textScale")
  const urlThemeParam = searchParams.get("theme")
  const previewUiScale =
    previewMode && urlScaleParam != null && urlScaleParam.trim() !== ""
      ? normalizeTabletUiScale(urlScaleParam)
      : null
  const urlTextScale =
    urlTextScaleParam != null && urlTextScaleParam.trim() !== ""
      ? normalizeTabletTextScale(urlTextScaleParam)
      : null
  const previewTheme =
    previewMode && urlThemeParam != null && urlThemeParam.trim() !== ""
      ? normalizeTabletTheme(urlThemeParam)
      : null
  const resolvedUiScale = previewUiScale ?? tabletUiScale
  const resolvedTextScale = urlTextScale ?? tabletTextScale
  const resolvedTheme = previewTheme ?? tabletTheme

  React.useEffect(() => {
    const fromUrl = parseTableFromSearchParam(searchParams.get("table"))
    dispatch(setTableName(fromUrl ?? initialTableName))
  }, [searchParams, initialTableName, dispatch])

  React.useEffect(() => {
    let cancelled = false

    const loadMenu = async (cacheBust?: number) => {
      if (!isValidMerchantId(merchantId)) {
        setMenu([])
        setSectionIcons({})
        setSectionMeta({})
        setRestaurantName(t.common.restaurant)
        setLoading(false)
        return
      }

      setLoading(true)

      const params = new URLSearchParams({ merchantId })
      if (isValidMerchantId(userId ? String(userId) : null)) {
        params.set("userId", String(userId))
      }
      if (cacheBust != null) {
        params.set("_t", String(cacheBust))
      }

      const response = await getApi<ApiResponse<ConsumerMenuPayload | IMenu[]>>({
        url: `${CONSUMER_MENU}?${params.toString()}`,
      })

      if (cancelled) return

      if (response?.success && response.data) {
        if (Array.isArray(response.data)) {
          setMenu(response.data)
          setSectionIcons({})
        } else {
          setMenu(response.data.menu ?? [])
          const name = response.data.restaurantName?.trim()
          setRestaurantName(name || t.common.restaurant)
          setSectionIcons(response.data.sectionIcons ?? {})
          setSectionMeta(response.data.sectionMeta ?? {})
          setTabletUiScale(
            normalizeTabletUiScale(
              response.data.tabletUiScale ??
                response.data.uiScale ??
                DEFAULT_TABLET_UI_SCALE
            )
          )
          setTabletTextScale(
            normalizeTabletTextScale(
              response.data.tabletTextScale ??
                response.data.textScale ??
                DEFAULT_TABLET_TEXT_SCALE
            )
          )
          setTabletTheme(
            normalizeTabletTheme(
              response.data.tabletTheme ??
                response.data.theme ??
                DEFAULT_TABLET_THEME
            )
          )
        }
      } else {
        setMenu([])
        setSectionIcons({})
        setSectionMeta({})
        setRestaurantName(t.common.restaurant)
      }

      setLoading(false)
    }

    void loadMenu()

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadMenu(Date.now())
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    const unsubscribeInfo = subscribeRestaurantInfoUpdated(() => {
      void loadMenu(Date.now())
    })

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisible)
      unsubscribeInfo()
    }
  }, [merchantId, userId, t.common.restaurant])

  React.useEffect(() => {
    dispatch(syncCartToCheckOut({ dispatch: dispatch }))
  }, [])

  return (
    <TabletMenuLayout
      merchantId={merchantId}
      restaurantName={restaurantName}
      tableName={tableName}
      menu={menu}
      sectionIcons={sectionIcons}
      sectionMeta={sectionMeta}
      loading={loading}
      uiScale={resolvedUiScale}
      textScale={resolvedTextScale}
      theme={resolvedTheme}
    />
  )
}

export default MerchantPage

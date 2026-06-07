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

type ConsumerMenuPayload = {
  menu: IMenu[]
  restaurantName: string
  sectionIcons?: Record<string, string>
  sectionMeta?: SectionMetaMap
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
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const tableName = useAppSelector((state) => state.checkOut.tableName)
  const userId = useAppSelector((state) => state.merchant).merchant?._id

  React.useEffect(() => {
    const fromUrl = parseTableFromSearchParam(searchParams.get("table"))
    dispatch(setTableName(fromUrl ?? initialTableName))
  }, [searchParams, initialTableName, dispatch])

  React.useEffect(() => {
    let cancelled = false

    const loadMenu = async () => {
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
          setRestaurantName(response.data.restaurantName ?? t.common.restaurant)
          setSectionIcons(response.data.sectionIcons ?? {})
          setSectionMeta(response.data.sectionMeta ?? {})
        }
      } else {
        setMenu([])
        setSectionIcons({})
        setSectionMeta({})
        setRestaurantName(t.common.restaurant)
      }

      setLoading(false)
    }

    loadMenu()

    return () => {
      cancelled = true
    }
  }, [merchantId, userId, t.common.restaurant])

  React.useEffect(() => {
    dispatch(syncCartToCheckOut({ dispatch: dispatch }))
  }, [])

  return (
    <TabletMenuLayout
      merchantId={merchantId}
      restaurantName={restaurantName || t.common.restaurant}
      tableName={tableName}
      menu={menu}
      sectionIcons={sectionIcons}
      sectionMeta={sectionMeta}
      loading={loading}
    />
  )
}

export default MerchantPage

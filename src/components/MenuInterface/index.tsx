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

type ConsumerMenuPayload = {
  menu: IMenu[]
  restaurantName: string
}

function MerchantPage({
  merchantId,
  initialTableName,
}: {
  merchantId: string
  initialTableName?: string
}) {
  const [menu, setMenu] = React.useState<IMenu[]>([])
  const [restaurantName, setRestaurantName] = React.useState("Restaurant")
  const [loading, setLoading] = React.useState(true)
  const dispatch = useAppDispatch()
  const searchParams = useSearchParams()
  const tableName = useAppSelector((state) => state.checkOut.tableName)
  const userId = useAppSelector((state) => state.merchant).merchant?._id

  React.useEffect(() => {
    const fromUrl = parseTableFromSearchParam(searchParams.get("table"))
    dispatch(setTableName(fromUrl ?? initialTableName))
  }, [searchParams, initialTableName, dispatch])

  const fetchMenu = async () => {
    setLoading(true)
    const response = await getApi<ApiResponse<ConsumerMenuPayload | IMenu[]>>({
      url: CONSUMER_MENU + `?merchantId=${merchantId}&userId=${userId}`,
    })

    if (response?.success && response.data) {
      if (Array.isArray(response.data)) {
        setMenu(response.data)
      } else {
        setMenu(response.data.menu ?? [])
        setRestaurantName(response.data.restaurantName ?? "Restaurant")
      }
    }
    setLoading(false)
  }

  React.useEffect(() => {
    fetchMenu()
  }, [merchantId])

  React.useEffect(() => {
    dispatch(syncCartToCheckOut({ dispatch: dispatch }))
  }, [])

  return (
    <TabletMenuLayout
      merchantId={merchantId}
      restaurantName={restaurantName}
      tableName={tableName}
      menu={menu}
      loading={loading}
    />
  )
}

export default MerchantPage

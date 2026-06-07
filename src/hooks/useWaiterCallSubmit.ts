"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import toast from "react-hot-toast"
import { POST_WAITER_CALL } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { postApi } from "@/utils/common"
import { useLocale } from "@/context/LocaleContext"
import { resolveConsumerWaiterCallTableName } from "@/utils/waiterCallTable"

export function useWaiterCallSubmit(
  merchantId: string,
  tableNameFromProps?: string
) {
  const { t } = useLocale()
  const searchParams = useSearchParams()
  const [callingStaff, setCallingStaff] = React.useState(false)

  const submitWaiterCall = React.useCallback(async () => {
    if (callingStaff) return false
    if (!merchantId) {
      toast.error(t.tablet.staffCallFailed)
      return false
    }

    const tableName = resolveConsumerWaiterCallTableName(
      tableNameFromProps,
      searchParams.get("table")
    )

    if (!tableName) {
      toast.error(t.tablet.staffCallFailed)
      return false
    }

    setCallingStaff(true)

    const res = await postApi<ApiResponse<unknown>>({
      url: POST_WAITER_CALL,
      values: { merchantId, tableName },
    })

    setCallingStaff(false)

    if (res?.success) {
      toast.success(t.tablet.staffCalled)
      return true
    }

    toast.error(res?.message || t.tablet.staffCallFailed)
    return false
  }, [callingStaff, merchantId, searchParams, t.tablet, tableNameFromProps])

  return { callingStaff, submitWaiterCall }
}

import React, { Suspense } from "react"
import CheckOut from "@/components/Checkout"
import { parseTableFromSearchParam } from "@/utils/table"
import { ClientPageLoading } from "@/components/common/ClientLoadingFallback"

async function page({
  params,
  searchParams,
}: {
  params: Promise<{ merchantId: string }>
  searchParams: Promise<{ table?: string }>
}) {
  const param = await params
  const sp = await searchParams
  const merchantId = param.merchantId
  const tableName = parseTableFromSearchParam(sp?.table ?? null)

  return (
    <Suspense fallback={<ClientPageLoading />}>
      <CheckOut merchantId={merchantId} initialTableName={tableName} />
    </Suspense>
  )
}

export default page

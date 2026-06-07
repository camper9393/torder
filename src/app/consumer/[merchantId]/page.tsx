import React, { Suspense } from "react"
import MenuInterface from "@/components/MenuInterface"
import { parseTableFromSearchParam } from "@/utils/table"
import { ClientMenuLoading } from "@/components/common/ClientLoadingFallback"

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
    <Suspense fallback={<ClientMenuLoading />}>
      <MenuInterface merchantId={merchantId} initialTableName={tableName} />
    </Suspense>
  )
}

export default page

import React, { Suspense } from "react"
import CheckOut from "@/components/Checkout"
import { parseTableFromSearchParam } from "@/utils/table"

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
    <Suspense fallback={<div className="px-6 pt-20 text-center">Loading...</div>}>
      <CheckOut merchantId={merchantId} initialTableName={tableName} />
    </Suspense>
  )
}

export default page

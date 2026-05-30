import React, { Suspense } from "react"
import MenuInterface from "@/components/MenuInterface"
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
    <Suspense fallback={<div className="min-h-screen bg-[#F8F5F0] pt-24 text-center">Loading menu...</div>}>
      <MenuInterface merchantId={merchantId} initialTableName={tableName} />
    </Suspense>
  )
}

export default page

"use client"

import { PATCH_WAITER_CALL } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { patchApi } from "@/utils/common"
import { WaiterCallRecord } from "@/types/waiterCall"
import { WaiterCallStatus } from "@/model/waiterCall"
import toast from "react-hot-toast"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

const statusLabel: Record<WaiterCallStatus, string> = {
  new: "New",
  accepted: "Accepted",
  done: "Done",
}

const statusColor: Record<WaiterCallStatus, string> = {
  new: "bg-rose-100 text-rose-800",
  accepted: "bg-amber-100 text-amber-800",
  done: "bg-green-100 text-green-800",
}

type WaiterCallAlertsProps = {
  calls: WaiterCallRecord[]
  onUpdated: () => void
}

function WaiterCallAlerts({ calls, onUpdated }: WaiterCallAlertsProps) {
  const updateStatus = async (id: string, status: WaiterCallStatus) => {
    const res = await patchApi<ApiResponse<WaiterCallRecord>>({
      url: `${PATCH_WAITER_CALL}/${id}`,
      values: { status },
    })

    if (!res?.success) {
      toast.error(res?.message || "Could not update waiter call")
      return
    }

    toast.success(`Waiter call ${statusLabel[status].toLowerCase()}`)
    onUpdated()
  }

  if (calls.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-rose-700">
        Staff calls
      </h2>
      <div className="flex flex-col gap-3">
        {calls.map((call) => (
          <article
            key={call._id}
            className="rounded-2xl border-2 border-rose-200 bg-rose-50/80 p-4 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-gray-900">
                🔔 {call.tableName} is calling staff
              </p>
              <Badge className={statusColor[call.status]}>
                {statusLabel[call.status]}
              </Badge>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              {new Date(call.createdAt).toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={call.status !== "new"}
                onClick={() => updateStatus(call._id, "accepted")}
                className="border-blue-600 text-blue-700 hover:bg-blue-50"
              >
                Accept
              </Button>
              <Button
                size="sm"
                disabled={call.status !== "accepted"}
                onClick={() => updateStatus(call._id, "done")}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Done
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default WaiterCallAlerts

import { TableDisplayStatus } from "@/utils/tableManagement"

export const tableStatusCardStyles: Record<
  TableDisplayStatus,
  { badge: string; border: string }
> = {
  free: {
    badge: "bg-green-100 text-green-800",
    border: "border-green-200 hover:border-green-300",
  },
  new: {
    badge: "bg-yellow-100 text-yellow-800",
    border: "border-yellow-200 hover:border-yellow-300",
  },
  accepted: {
    badge: "bg-blue-100 text-blue-800",
    border: "border-blue-200 hover:border-blue-300",
  },
  cooking: {
    badge: "bg-orange-100 text-orange-800",
    border: "border-orange-200 hover:border-orange-300",
  },
  waiting_bill: {
    badge: "bg-purple-100 text-purple-800",
    border: "border-purple-200 hover:border-purple-300",
  },
}

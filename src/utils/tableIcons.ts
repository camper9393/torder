import { TableDisplayStatus } from "@/utils/tableManagement"

/** PNG assets for table cards (public/img/tables). */
export const TABLE_ICON_BY_STATUS: Record<TableDisplayStatus, string> = {
  free: "/img/tables/table-empty.png",
  new: "/img/tables/table-new-order.png",
  accepted: "/img/tables/table-accepted.png",
  cooking: "/img/tables/table-cooking.png",
  waiting_bill: "/img/tables/table-done.png",
}

export function getTableIconSrc(status: TableDisplayStatus): string {
  return TABLE_ICON_BY_STATUS[status]
}

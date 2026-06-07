import { OrderStatus } from "@/model/order"
import { labelOrderStatus as labelOrderStatusForLocale } from "./index"
import { Locale } from "./types"

export function labelOrderStatus(
  status: OrderStatus,
  locale: Locale = "mn"
): string {
  return labelOrderStatusForLocale(status, locale)
}

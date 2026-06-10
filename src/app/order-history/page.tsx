import { redirect } from "next/navigation"

export default function OrderHistoryRedirectPage() {
  redirect("/admin/reports/order-history")
}

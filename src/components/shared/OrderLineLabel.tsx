"use client"

import { useLocale } from "@/context/LocaleContext"
import {
  formatOrderItemLine,
  type OrderItemDisplay,
} from "@/utils/menuBilingual"

type OrderLineLabelProps = {
  item: OrderItemDisplay
  quantity?: number
}

export function OrderLineLabel({ item, quantity }: OrderLineLabelProps) {
  const { locale } = useLocale()
  return <>{formatOrderItemLine(item, locale, quantity)}</>
}

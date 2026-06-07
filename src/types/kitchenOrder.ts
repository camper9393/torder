import { OrderStatus } from "@/model/order"

export type KitchenOrder = {
  _id: string
  merchantId?: string
  tableName: string
  items: {
    menuItemId?: string
    title: string
    nameMn?: string
    nameEn?: string
    selectedSizeLabelMn?: string
    selectedSizeLabelEn?: string
    price: number
    quantity: number
    image?: string
    served?: boolean
  }[]
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt?: string
}

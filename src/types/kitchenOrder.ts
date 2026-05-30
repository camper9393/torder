import { OrderStatus } from "@/model/order"

export type KitchenOrder = {
  _id: string
  merchantId?: string
  tableName: string
  items: {
    title: string
    price: number
    quantity: number
    image?: string
  }[]
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt?: string
}

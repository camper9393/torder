import { OrderStatus } from "@/model/order"
import type { InventoryAlert } from "@/types/inventory"

export type AdminDashboardMetrics = {
  todayRevenue: number
  todayRefunds: number
  todayNetRevenue: number
  todayOrders: number
  activeOrders: number
  completedOrders: number
}

export type AdminStatusCounts = Record<OrderStatus, number>

export type AdminTopItem = {
  title: string
  quantity: number
}

export type AdminRecentOrder = {
  _id: string
  tableName: string
  total: number
  status: OrderStatus
  createdAt: string
}

export type AdminDayStat = {
  date: string
  label: string
  revenue: number
  refunds: number
  netRevenue: number
  orders: number
}

export type AdminDashboardData = {
  metrics: AdminDashboardMetrics
  statusCounts: AdminStatusCounts
  topItems: AdminTopItem[]
  recentOrders: AdminRecentOrder[]
  revenueByDay: AdminDayStat[]
  ordersByDay: AdminDayStat[]
  inventoryAlerts: InventoryAlert[]
}

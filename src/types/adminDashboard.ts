import { OrderStatus } from "@/model/order"

export type AdminDashboardMetrics = {
  todayRevenue: number
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
  orders: number
}

export type AdminDashboardData = {
  metrics: AdminDashboardMetrics
  statusCounts: AdminStatusCounts
  topItems: AdminTopItem[]
  recentOrders: AdminRecentOrder[]
  revenueByDay: AdminDayStat[]
  ordersByDay: AdminDayStat[]
}

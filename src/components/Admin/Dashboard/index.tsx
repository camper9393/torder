"use client"



import React from "react"

import { GET_ADMIN_DASHBOARD } from "@/utils/APIConstant"

import { ApiResponse } from "@/utils/api"

import { getApi } from "@/utils/common"

import { AdminDashboardData } from "@/types/adminDashboard"

import { OrderStatus } from "@/model/order"

import {

  BarChart,

  Bar,

  LineChart,

  Line,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

} from "recharts"

import { ChartResponsiveContainer } from "@/components/Dashboard/ChartResponsiveContainer"

import {

  Banknote,

  ShoppingBag,

  ChefHat,

  CheckCircle2,

  LayoutDashboard,

} from "lucide-react"

import { cn } from "@/lib/utils"


import { formatPrice } from "@/utils/currency"

import { labelOrderStatus } from "@/utils/i18n/orderStatus"

import { useLocale } from "@/context/LocaleContext"
import SidebarMenuToggle from "@/components/layout/SidebarMenuToggle"

const statusStyles: Record<

  OrderStatus,

  { color: string; bg: string }

> = {

  new: {

    color: "text-amber-800",

    bg: "bg-amber-50 border-amber-200",

  },

  accepted: {

    color: "text-blue-800",

    bg: "bg-blue-50 border-blue-200",

  },

  cooking: {

    color: "text-orange-800",

    bg: "bg-orange-50 border-orange-200",

  },

  done: {

    color: "text-green-800",

    bg: "bg-green-50 border-green-200",

  },

  closed: {

    color: "text-gray-800",

    bg: "bg-gray-50 border-gray-200",

  },

}



function MetricCard({

  title,

  value,

  icon,

  accent,

}: {

  title: string

  value: string

  icon: React.ReactNode

  accent: string

}) {

  return (

    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <div className="mb-3 flex items-center justify-between">

        <p className="text-sm font-medium text-gray-500">{title}</p>

        <div

          className={cn(

            "flex h-10 w-10 items-center justify-center rounded-xl",

            accent

          )}

        >

          {icon}

        </div>

      </div>

      <p className="text-2xl font-bold text-gray-900 md:text-3xl">{value}</p>

    </div>

  )

}



function ChartCard({

  title,

  subtitle,

  children,

}: {

  title: string

  subtitle: string

  children: React.ReactElement

}) {

  return (

    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>

      <p className="mb-4 text-sm text-gray-500">{subtitle}</p>

      <ChartResponsiveContainer>{children}</ChartResponsiveContainer>

    </div>

  )

}



function AdminDashboard() {

  const [data, setData] = React.useState<AdminDashboardData | null>(null)

  const [loading, setLoading] = React.useState(true)

  const { t, locale, dateLocale } = useLocale()

  const a = t.admin

  const c = t.common

  const displayStatuses: OrderStatus[] = ["new", "accepted", "cooking", "done"]



  React.useEffect(() => {

    const load = async () => {

      const res = await getApi<ApiResponse<AdminDashboardData>>({

        url: GET_ADMIN_DASHBOARD,

      })

      if (res?.success && res.data) setData(res.data)

      setLoading(false)

    }

    load()

  }, [])



  if (loading) {

    return (

      <div className="py-16 text-center text-gray-500">{a.loading}</div>

    )

  }



  if (!data) {

    return (

      <div className="py-16 text-center text-gray-500">{a.loadFailed}</div>

    )

  }



  const { metrics, statusCounts, topItems, recentOrders, revenueByDay, ordersByDay } =

    data



  return (

    <div className="min-h-screen bg-[#F8F5F0] pb-10">

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <SidebarMenuToggle />

          <LayoutDashboard className="h-8 w-8 text-green-600" aria-hidden />

          <div>

            <h1 className="font-serif text-2xl font-bold text-slate-950 md:text-3xl">

              {a.title}

            </h1>

            <p className="text-sm text-gray-600">{a.subtitle}</p>

          </div>

        </div>

      </div>



      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <MetricCard

          title={a.todayRevenue}

          value={formatPrice(metrics.todayRevenue)}

          icon={<Banknote className="h-5 w-5 text-emerald-700" />}

          accent="bg-emerald-100"

        />

        <MetricCard

          title={a.todayOrders}

          value={String(metrics.todayOrders)}

          icon={<ShoppingBag className="h-5 w-5 text-indigo-700" />}

          accent="bg-indigo-100"

        />

        <MetricCard

          title={a.activeOrders}

          value={String(metrics.activeOrders)}

          icon={<ChefHat className="h-5 w-5 text-orange-700" />}

          accent="bg-orange-100"

        />

        <MetricCard

          title={a.completedOrders}

          value={String(metrics.completedOrders)}

          icon={<CheckCircle2 className="h-5 w-5 text-green-700" />}

          accent="bg-green-100"

        />

      </div>



      <section className="mb-8">

        <h2 className="mb-4 text-lg font-semibold text-gray-900">{a.ordersSection}</h2>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

          {displayStatuses.map((status) => (

            <div

              key={status}

              className={cn(

                "rounded-2xl border p-4 text-center shadow-sm",

                statusStyles[status].bg

              )}

            >

              <p

                className={cn(

                  "text-sm font-semibold",

                  statusStyles[status].color

                )}

              >

                {labelOrderStatus(status, locale)}

              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">

                {statusCounts[status]}

              </p>

            </div>

          ))}

        </div>

      </section>



      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">

        <ChartCard title={a.revenueByDay} subtitle={a.last7Days}>

          <BarChart data={revenueByDay}>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

              <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />

              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />

              <Tooltip

                formatter={(value) => [formatPrice(Number(value)), a.revenue]}

                contentStyle={{ borderRadius: 12, fontSize: 12 }}

              />

              <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />

            </BarChart>

        </ChartCard>



        <ChartCard title={a.ordersByDay} subtitle={a.last7Days}>

          <LineChart data={ordersByDay}>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />

              <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />

              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />

              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />

              <Line

                type="monotone"

                dataKey="orders"

                stroke="#6366f1"

                strokeWidth={3}

                dot={{ r: 4 }}

              />

            </LineChart>

        </ChartCard>

      </div>



      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <section className="rounded-2xl border bg-white p-5 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-gray-900">

            {a.topSelling}

          </h2>

          {topItems.length === 0 ? (

            <p className="text-sm text-gray-500">{a.noSales}</p>

          ) : (

            <ul className="space-y-3">

              {topItems.map((item, idx) => (

                <li

                  key={item.title}

                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"

                >

                  <span className="flex items-center gap-3">

                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800">

                      {idx + 1}

                    </span>

                    <span className="font-medium text-gray-900">{item.title}</span>

                  </span>

                  <span className="text-sm font-semibold text-gray-600">

                    {item.quantity} {c.sold}

                  </span>

                </li>

              ))}

            </ul>

          )}

        </section>



        <section className="rounded-2xl border bg-white p-5 shadow-sm">

          <h2 className="mb-4 text-lg font-semibold text-gray-900">

            {a.recentOrders}

          </h2>

          {recentOrders.length === 0 ? (

            <p className="text-sm text-gray-500">{a.noOrders}</p>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[320px] text-left text-sm">

                <thead>

                  <tr className="border-b text-gray-500">

                    <th className="pb-2 font-medium">{c.table}</th>

                    <th className="pb-2 font-medium">{c.total}</th>

                    <th className="pb-2 font-medium">{c.status}</th>

                    <th className="pb-2 font-medium">{c.time}</th>

                  </tr>

                </thead>

                <tbody>

                  {recentOrders.map((order) => (

                    <tr key={order._id} className="border-b border-gray-100">

                      <td className="py-3 font-medium text-gray-900">

                        {order.tableName}

                      </td>

                      <td className="py-3">{formatPrice(order.total)}</td>

                      <td className="py-3">

                        {labelOrderStatus(order.status as OrderStatus, locale)}

                      </td>

                      <td className="py-3 text-gray-500">

                        {new Date(order.createdAt).toLocaleString(dateLocale, {

                          dateStyle: "short",

                          timeStyle: "short",

                        })}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </div>

  )

}



export default AdminDashboard


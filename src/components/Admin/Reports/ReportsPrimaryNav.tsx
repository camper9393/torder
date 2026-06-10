"use client"



import Link from "next/link"

import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"



const REPORT_TABS = [

  { label: "Борлуулалтын тайлан", href: "/admin/reports/sales" },

  { label: "Захиалгын түүх", href: "/admin/reports/order-history" },

  { label: "Буцаалт", href: "/admin/reports/refunds" },

  { label: "Нэгдсэн тайлан", href: "/admin/reports/summary" },

  { label: "Бүтээгдэхүүний борлуулалт", href: "/admin/reports/products" },

  { label: "Гүйлгээний тайлан", href: "/admin/reports/transactions" },

  { label: "Гал тогооны тайлан", href: "/admin/reports/kitchen" },

  { label: "Зөөгчийн тайлан", href: "/admin/reports/waiters" },

  { label: "НӨАТ", href: "/admin/reports/vat" },

] as const



export default function ReportsPrimaryNav() {

  const pathname = usePathname() ?? ""



  return (

    <nav

      className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4"

      aria-label="Тайлангийн цэс"

    >

      {REPORT_TABS.map((tab) => {

        const active =
          pathname === tab.href ||
          pathname.startsWith(`${tab.href}/`) ||
          (tab.href === "/admin/reports/sales" &&
            pathname === "/admin/reports/orders")



        return (

          <Link

            key={tab.href}

            href={tab.href}

            className={cn(

              "min-h-10 rounded-full px-4 text-sm font-semibold touch-manipulation transition",

              active

                ? "bg-green-600 text-white shadow-sm"

                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"

            )}

          >

            {tab.label}

          </Link>

        )

      })}

    </nav>

  )

}


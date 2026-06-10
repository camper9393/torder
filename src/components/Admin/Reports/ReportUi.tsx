"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { ChartResponsiveContainer } from "@/components/Dashboard/ChartResponsiveContainer"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ReportDatePreset } from "@/utils/reports/dateRange"
import {
  REPORT_DATE_PRESETS,
  validateCustomReportRange,
} from "@/utils/reports/dateRange"
import { formatPrice } from "@/utils/currency"
import { AlertCircle, Loader2 } from "lucide-react"

/** Custom огноо сонгоогүй үед API дуудахгүй байх gate */
export function useReportRangeGate(preset: ReportDatePreset) {
  const [rangeReady, setRangeReady] = React.useState(preset !== "custom")

  React.useEffect(() => {
    setRangeReady(preset !== "custom")
  }, [preset])

  const applyCustomRange = React.useCallback(
    (from: string, to: string, onValid?: () => void) => {
      const err = validateCustomReportRange("custom", from, to)
      if (err) return err
      setRangeReady(true)
      onValid?.()
      return null
    },
    []
  )

  return { rangeReady, applyCustomRange }
}

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
]

export function ReportPageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      ) : null}
    </div>
  )
}

export function ReportMetricCard({
  title,
  value,
  accent = "text-gray-900",
  hint,
}: {
  title: string
  value: string
  accent?: string
  hint?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={cn("mt-2 text-2xl font-bold md:text-3xl", accent)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}

export function ReportChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactElement
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      {subtitle ? (
        <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
      ) : null}
      <div className="mt-4 min-w-0">{children}</div>
    </div>
  )
}

export function ReportDateFilter({
  preset,
  from,
  to,
  onPresetChange,
  onFromChange,
  onToChange,
  onApply,
}: {
  preset: ReportDatePreset
  from: string
  to: string
  onPresetChange: (preset: ReportDatePreset) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onApply?: () => void
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-2">
        {REPORT_DATE_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPresetChange(item.id)}
            className={cn(
              "min-h-9 rounded-full px-4 text-sm font-semibold transition",
              preset === item.id
                ? "bg-green-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === "custom" ? (
        <>
          <input
            type="date"
            className="rounded-lg border px-3 py-2 text-sm"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
          />
          <input
            type="date"
            className="rounded-lg border px-3 py-2 text-sm"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
          />
          {onApply ? (
            <button
              type="button"
              onClick={onApply}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Хэрэглэх
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export function ReportLoading({ label = "Ачааллаж байна..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed bg-white py-16 text-gray-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  )
}

export function ReportEmpty({ message = "Өгөгдөл олдсонгүй" }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed bg-white py-16 text-center text-gray-500">
      {message}
    </div>
  )
}

export function ReportError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Дахин оролдох
        </button>
      ) : null}
    </div>
  )
}

export function ReportBarChart({
  data,
  dataKey = "revenue",
}: {
  data: { label: string; revenue: number; orders?: number }[]
  dataKey?: string
}) {
  if (!data.length) return <ReportEmpty />
  return (
    <ChartResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value) => [formatPrice(Number(value)), "Дүн"]}
          contentStyle={{ borderRadius: 12, fontSize: 12 }}
        />
        <Bar dataKey={dataKey} fill="#10b981" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartResponsiveContainer>
  )
}

export function ReportLineChart({
  data,
}: {
  data: { label: string; revenue: number }[]
}) {
  if (!data.length) return <ReportEmpty />
  return (
    <ChartResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value) => [formatPrice(Number(value)), "Дүн"]}
          contentStyle={{ borderRadius: 12, fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartResponsiveContainer>
  )
}

export function ReportPieChart({
  data,
}: {
  data: { name: string; value: number }[]
}) {
  const chartData = data.filter((row) => row.value > 0)
  if (!chartData.length) return <ReportEmpty />
  return (
    <ChartResponsiveContainer height={240}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {chartData.map((_, index) => (
            <Cell
              key={index}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatPrice(Number(value))} />
      </PieChart>
    </ChartResponsiveContainer>
  )
}

export function ReportDataTable({
  columns,
  rows,
}: {
  columns: { key: string; label: string; align?: "left" | "right" }[]
  rows: Record<string, React.ReactNode>[]
}) {
  if (!rows.length) return <ReportEmpty />
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-gray-600">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 font-semibold",
                  col.align === "right" && "text-right"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b last:border-0 hover:bg-gray-50/80">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-gray-800",
                    col.align === "right" && "text-right"
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ReportExportActions({
  onCsv,
  onPrint,
  csvLabel = "CSV татах",
  printLabel = "Хэвлэх",
}: {
  onCsv?: () => void
  onPrint?: () => void
  csvLabel?: string
  printLabel?: string
}) {
  if (!onCsv && !onPrint) return null
  return (
    <div className="mb-4 flex flex-wrap gap-2 print:hidden">
      {onCsv ? (
        <button
          type="button"
          onClick={onCsv}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {csvLabel}
        </button>
      ) : null}
      {onPrint ? (
        <button
          type="button"
          onClick={onPrint}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {printLabel}
        </button>
      ) : null}
    </div>
  )
}

export function ReportInfoBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {message}
    </div>
  )
}

export function ReportPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Өмнөх
      </button>
      <span className="text-sm text-gray-600">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
      >
        Дараах
      </button>
    </div>
  )
}

import type { ReportDateRange } from "@/utils/reports/dateRange";
import { Types } from "mongoose";

export const COMPLETED_ORDER_STATUSES = ["done", "closed"] as const;

/** MongoDB aggregation timezone for report date/hour grouping */
export const REPORT_TIMEZONE = "Asia/Ulaanbaatar";

export function reportDateToString(field: string) {
  return {
    $dateToString: {
      format: "%Y-%m-%d",
      date: field,
      timezone: REPORT_TIMEZONE,
    },
  };
}

export function reportHourOfDay(field: string) {
  return { $hour: { date: field, timezone: REPORT_TIMEZONE } };
}

export function reportMonthString(field: string) {
  return {
    $dateToString: {
      format: "%Y-%m",
      date: field,
      timezone: REPORT_TIMEZONE,
    },
  };
}

export function completedOrdersMatch(
  merchantId: Types.ObjectId,
  range: ReportDateRange
) {
  return {
    merchantId,
    status: { $in: [...COMPLETED_ORDER_STATUSES] },
    updatedAt: { $gte: range.start, $lte: range.end },
  };
}

export function refundsMatch(merchantId: Types.ObjectId, range: ReportDateRange) {
  return {
    merchantId,
    createdAt: { $gte: range.start, $lte: range.end },
  };
}

export const GROSS_SALES_EXPR = {
  $ifNull: ["$paidAmount", "$total"],
} as const;

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function weekLabel(year: number, week: number): string {
  return `${year}-W${String(week).padStart(2, "0")}`;
}

const DRINK_SECTION_PATTERN =
  /уух|ундаа|drink|cola|coffee|juice|beer|wine|сүү|цай/i;

export function isDrinkSection(section?: string | null): boolean {
  if (!section) return false;
  return DRINK_SECTION_PATTERN.test(section);
}

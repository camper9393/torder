export type ReportDatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "custom";

export type ReportDateRange = {
  preset: ReportDatePreset;
  start: Date;
  end: Date;
  label: string;
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function resolveReportDateRange(
  presetRaw: string | null,
  fromRaw?: string | null,
  toRaw?: string | null
): ReportDateRange {
  const now = new Date();
  const preset = (presetRaw || "last7") as ReportDatePreset;

  if (preset === "custom" && fromRaw && toRaw) {
    const start = startOfDay(new Date(fromRaw));
    const end = endOfDay(new Date(toRaw));
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return {
        preset: "custom",
        start,
        end: end < start ? endOfDay(start) : end,
        label: `${fromRaw} – ${toRaw}`,
      };
    }
  }

  switch (preset) {
    case "today":
      return {
        preset: "today",
        start: startOfDay(now),
        end: endOfDay(now),
        label: "Өнөөдөр",
      };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return {
        preset: "yesterday",
        start: startOfDay(y),
        end: endOfDay(y),
        label: "Өчигдөр",
      };
    }
    case "last30": {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 29);
      return {
        preset: "last30",
        start,
        end: endOfDay(now),
        label: "Сүүлийн 30 хоног",
      };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        preset: "thisMonth",
        start: startOfDay(start),
        end: endOfDay(now),
        label: "Энэ сар",
      };
    }
    case "last7":
    default: {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 6);
      return {
        preset: preset === "last7" ? "last7" : "today",
        start,
        end: endOfDay(now),
        label: preset === "last7" ? "Сүүлийн 7 хоног" : "Өнөөдөр",
      };
    }
  }
}

export function validateCustomReportRange(
  presetRaw: string | null,
  fromRaw?: string | null,
  toRaw?: string | null
): string | null {
  const preset = (presetRaw || "last7") as ReportDatePreset;
  if (preset !== "custom") return null;
  if (!fromRaw?.trim() || !toRaw?.trim()) {
    return "Захиалгат огноо сонгохын тулд эхлэх болон дуусах огноо оруулна уу";
  }
  const start = new Date(fromRaw);
  const end = new Date(toRaw);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Огноо буруу байна";
  }
  return null;
}

export const REPORT_DATE_PRESETS: {
  id: ReportDatePreset;
  label: string;
}[] = [
  { id: "today", label: "Өнөөдөр" },
  { id: "yesterday", label: "Өчигдөр" },
  { id: "last7", label: "7 хоног" },
  { id: "last30", label: "30 хоног" },
  { id: "thisMonth", label: "Энэ сар" },
  { id: "custom", label: "Захиалгат" },
];

import { TableDisplayStatus } from "@/utils/tableManagement"

/** Light POS table card styles for /admin/tables */
export const adminTablePosStyles: Record<
  TableDisplayStatus,
  {
    card: string
    badge: string
    dot: string
    iconRing: string
    accent: string
    badgeLabel: string
  }
> = {
  free: {
    card: "border-slate-200 hover:border-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    iconRing: "ring-slate-200",
    accent: "text-slate-500",
    badgeLabel: "Чөлөөтэй",
  },
  new: {
    card: "border-slate-200 hover:border-orange-200",
    badge: "bg-orange-50 text-orange-700 border border-orange-200",
    dot: "bg-orange-500",
    iconRing: "ring-orange-300/60",
    accent: "text-orange-600",
    badgeLabel: "Шинэ захиалга",
  },
  accepted: {
    card: "border-slate-200 hover:border-blue-200",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
    dot: "bg-blue-500",
    iconRing: "ring-blue-300/60",
    accent: "text-blue-600",
    badgeLabel: "Хүлээн авсан",
  },
  cooking: {
    card: "border-slate-200 hover:border-amber-200",
    badge: "bg-amber-50 text-amber-800 border border-amber-200",
    dot: "bg-amber-500",
    iconRing: "ring-amber-300/70",
    accent: "text-amber-600",
    badgeLabel: "Хийж байна",
  },
  waiting_bill: {
    card: "border-slate-200 hover:border-emerald-200",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
    iconRing: "ring-emerald-300/60",
    accent: "text-emerald-600",
    badgeLabel: "Дууссан",
  },
}

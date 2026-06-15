import {
  SupportPriority,
  SupportStatus,
  SupportType,
} from "@/constants/support";

export const SUPPORT_CATEGORY_OPTIONS = [
  { value: SupportType.BUG, label: "Алдаа (Bug)" },
  { value: SupportType.TECHNICAL, label: "Техникийн тусламж" },
  { value: SupportType.FEATURE, label: "Санал хүсэлт" },
  { value: SupportType.PAYMENT, label: "Төлбөр" },
  { value: SupportType.OTHER, label: "Бусад" },
] as const;

export const SUPPORT_PRIORITY_OPTIONS = [
  { value: SupportPriority.LOW, label: "Бага" },
  { value: SupportPriority.MEDIUM, label: "Дунд" },
  { value: SupportPriority.URGENT, label: "Яаралтай" },
] as const;

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  [SupportStatus.NEW]: "Шинэ",
  [SupportStatus.IN_PROGRESS]: "Шалгаж байна",
  [SupportStatus.WAITING]: "Хариулт хүлээж байна",
  [SupportStatus.RESOLVED]: "Шийдэгдсэн",
  [SupportStatus.CLOSED]: "Хаагдсан",
};

export function labelSupportType(type: string): string {
  return (
    SUPPORT_CATEGORY_OPTIONS.find((o) => o.value === type)?.label ?? type
  );
}

export function labelSupportPriority(priority: string): string {
  return (
    SUPPORT_PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ??
    priority
  );
}

export function labelSupportStatus(status: string): string {
  return (
    SUPPORT_STATUS_LABELS[status as SupportStatus] ?? status
  );
}

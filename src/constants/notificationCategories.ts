export type NotificationReadCategory = "support" | "errors";

export const NOTIFICATION_TYPES_BY_CATEGORY: Record<
  NotificationReadCategory,
  string[]
> = {
  support: ["support.new_request", "support.reply"],
  errors: ["system.error"],
};

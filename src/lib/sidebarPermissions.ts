import { UserRole } from "@/constants/userRoles";
import {
  Permission,
  type PermissionKey,
  userHasPermission,
} from "@/lib/permissions";

export const SIDEBAR_DENIED_TOOLTIP =
  "Танд энэ хэсэгт хандах эрх байхгүй";

export const SIDEBAR_POS_CONTEXT_TOOLTIP = "Ресторан сонгоно уу";

export type SidebarNavKey =
  | "dashboard"
  | "tables"
  | "delivery"
  | "menu"
  | "inventory"
  | "tablet-order"
  | "kitchen"
  | "reports"
  | "help"
  | "staff"
  | "settings"
  | "profile";

/** Platform owner-д ресторан контекст шаарддаг sidebar цэс */
export const POS_CONTEXT_NAV_KEYS = new Set<SidebarNavKey>([
  "dashboard",
  "tables",
  "delivery",
  "menu",
  "inventory",
  "tablet-order",
  "kitchen",
  "reports",
]);
/** Sidebar цэс → Permission (null = бүх нэвтэрсэн хэрэглэгчид) */
export const SIDEBAR_NAV_PERMISSIONS: Record<
  SidebarNavKey,
  PermissionKey | null
> = {
  dashboard: Permission.REPORTS,
  tables: Permission.TABLES,
  delivery: Permission.ORDERS,
  menu: Permission.MENU,
  inventory: Permission.MENU,
  "tablet-order": Permission.ORDERS,
  kitchen: Permission.KITCHEN,
  reports: Permission.REPORTS,
  help: null,
  staff: Permission.STAFF,
  settings: null,
  profile: null,
};

export type SidebarUser = {
  role: UserRole;
  permissions: string[];
};

export function canAccessSidebarNav(
  user: SidebarUser | null | undefined,
  key: SidebarNavKey,
  options?: { hasPosRestaurantContext?: boolean }
): boolean {
  if (!user) {
    return true;
  }

  const permission = SIDEBAR_NAV_PERMISSIONS[key];
  if (permission && !userHasPermission(user, permission)) {
    return false;
  }

  if (
    user.role === UserRole.PLATFORM_OWNER &&
    !options?.hasPosRestaurantContext &&
    POS_CONTEXT_NAV_KEYS.has(key)
  ) {
    return false;
  }

  if (!permission) {
    return true;
  }

  return true;
}

export function getSidebarNavDeniedTooltip(
  user: SidebarUser | null | undefined,
  key: SidebarNavKey,
  options?: { hasPosRestaurantContext?: boolean }
): string {
  if (!user) {
    return SIDEBAR_DENIED_TOOLTIP;
  }

  const permission = SIDEBAR_NAV_PERMISSIONS[key];
  if (permission && !userHasPermission(user, permission)) {
    return SIDEBAR_DENIED_TOOLTIP;
  }

  if (
    user.role === UserRole.PLATFORM_OWNER &&
    !options?.hasPosRestaurantContext &&
    POS_CONTEXT_NAV_KEYS.has(key)
  ) {
    return SIDEBAR_POS_CONTEXT_TOOLTIP;
  }

  return SIDEBAR_DENIED_TOOLTIP;
}

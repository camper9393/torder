import { UserRole } from "@/constants/userRoles";
import {
  Permission,
  type PermissionKey,
  userHasPermission,
} from "@/lib/permissions";

export const SIDEBAR_DENIED_TOOLTIP =
  "Танд энэ хэсэгт хандах эрх байхгүй";

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
  settings: Permission.SETTINGS,
  profile: null,
};

export type SidebarUser = {
  role: UserRole;
  permissions: string[];
};

export function canAccessSidebarNav(
  user: SidebarUser | null | undefined,
  key: SidebarNavKey
): boolean {
  if (!user) {
    return true;
  }

  const permission = SIDEBAR_NAV_PERMISSIONS[key];
  if (!permission) {
    return true;
  }

  return userHasPermission(user, permission);
}

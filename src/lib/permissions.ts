import {
  RESTAURANT_STAFF_ROLES,
  ROLE_LABELS_MN,
  STAFF_MANAGEMENT_ROLES,
  UserRole,
} from "@/constants/userRoles";
import type { IUser } from "@/model/user";

/** Feature areas used for role-based access control */
export const Permission = {
  MENU: "menu",
  ORDERS: "orders",
  TABLES: "tables",
  KITCHEN: "kitchen",
  REPORTS: "reports",
  STAFF: "staff",
  PAYMENTS: "payments",
  SETTINGS: "settings",
  PLATFORM: "platform",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

const ALL_PERMISSIONS = Object.values(Permission);

export const ROLE_PERMISSIONS: Record<UserRole, readonly PermissionKey[]> = {
  [UserRole.PLATFORM_OWNER]: ALL_PERMISSIONS,
  [UserRole.RESTAURANT_OWNER]: [
    Permission.MENU,
    Permission.ORDERS,
    Permission.TABLES,
    Permission.KITCHEN,
    Permission.REPORTS,
    Permission.STAFF,
    Permission.PAYMENTS,
    Permission.SETTINGS,
  ],
  [UserRole.MANAGER]: [
    Permission.MENU,
    Permission.ORDERS,
    Permission.TABLES,
    Permission.KITCHEN,
    Permission.REPORTS,
    Permission.STAFF,
    Permission.PAYMENTS,
  ],
  [UserRole.CASHIER]: [Permission.ORDERS, Permission.TABLES, Permission.PAYMENTS],
  [UserRole.WAITER]: [Permission.TABLES, Permission.ORDERS],
  [UserRole.KITCHEN]: [Permission.KITCHEN],
};

export { ROLE_LABELS_MN, RESTAURANT_STAFF_ROLES, STAFF_MANAGEMENT_ROLES };

export function roleHasPermission(
  role: UserRole,
  permission: PermissionKey
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function userHasPermission(
  user: Pick<IUser, "role" | "permissions">,
  permission: PermissionKey
): boolean {
  if (user.permissions.includes(permission) || user.permissions.includes("*")) {
    return true;
  }
  return roleHasPermission(user.role, permission);
}

export function canAccessStaffManagement(user: Pick<IUser, "role">): boolean {
  return STAFF_MANAGEMENT_ROLES.includes(user.role);
}

export function canAssignRole(
  actor: Pick<IUser, "role">,
  targetRole: UserRole
): boolean {
  if (actor.role === UserRole.PLATFORM_OWNER) {
    return RESTAURANT_STAFF_ROLES.includes(targetRole);
  }
  if (actor.role === UserRole.RESTAURANT_OWNER) {
    return RESTAURANT_STAFF_ROLES.includes(targetRole);
  }
  if (actor.role === UserRole.MANAGER) {
    return targetRole !== UserRole.RESTAURANT_OWNER;
  }
  return false;
}

export function canManageStaffMember(
  actor: Pick<IUser, "role" | "restaurantId">,
  target: Pick<IUser, "role" | "restaurantId">
): boolean {
  if (!canAccessStaffManagement(actor)) {
    return false;
  }
  if (actor.role === UserRole.MANAGER && target.role === UserRole.RESTAURANT_OWNER) {
    return false;
  }
  if (actor.role === UserRole.PLATFORM_OWNER) {
    return true;
  }
  if (!actor.restaurantId || !target.restaurantId) {
    return false;
  }
  return String(actor.restaurantId) === String(target.restaurantId);
}

export function assignableRolesFor(actor: Pick<IUser, "role">): UserRole[] {
  if (actor.role === UserRole.PLATFORM_OWNER) {
    return [...RESTAURANT_STAFF_ROLES];
  }
  if (actor.role === UserRole.RESTAURANT_OWNER) {
    return [...RESTAURANT_STAFF_ROLES];
  }
  if (actor.role === UserRole.MANAGER) {
    return RESTAURANT_STAFF_ROLES.filter((r) => r !== UserRole.RESTAURANT_OWNER);
  }
  return [];
}

export function canAccessPlatformPages(user: Pick<IUser, "role">): boolean {
  return user.role === UserRole.PLATFORM_OWNER;
}

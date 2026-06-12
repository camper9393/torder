export enum UserRole {
  PLATFORM_OWNER = "platformOwner",
  RESTAURANT_OWNER = "restaurantOwner",
  MANAGER = "manager",
  CASHIER = "cashier",
  WAITER = "waiter",
  KITCHEN = "kitchen",
}

export const ROLE_LABELS_MN: Record<UserRole, string> = {
  [UserRole.PLATFORM_OWNER]: "Platform owner",
  [UserRole.RESTAURANT_OWNER]: "Рестораны эзэмшигч",
  [UserRole.MANAGER]: "Менежер",
  [UserRole.CASHIER]: "Кассчин",
  [UserRole.WAITER]: "Зөөгч",
  [UserRole.KITCHEN]: "Гал тогоо",
};

export const RESTAURANT_STAFF_ROLES: UserRole[] = [
  UserRole.RESTAURANT_OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN,
];

export const STAFF_MANAGEMENT_ROLES: UserRole[] = [
  UserRole.PLATFORM_OWNER,
  UserRole.RESTAURANT_OWNER,
  UserRole.MANAGER,
];

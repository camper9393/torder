import { ROLE_LABELS_MN, UserRole } from "@/constants/userRoles";
import {
  Permission,
  type PermissionKey,
  userHasPermission,
} from "@/lib/permissions";
import type { IUser } from "@/model/user";
import {
  RestaurantPlan,
  SubscriptionStatus,
  type IRestaurant,
} from "@/model/restaurant";

export type ProfileAction = {
  id: string;
  label: string;
  permission: PermissionKey;
};

/** Профайл хуудсан дээр харуулах үйлдлийн жагсаалт */
export const PROFILE_ACTIONS: readonly ProfileAction[] = [
  { id: "menu", label: "Цэс харах / засах", permission: Permission.MENU },
  {
    id: "orders",
    label: "Захиалга харах / өөрчлөх",
    permission: Permission.ORDERS,
  },
  { id: "tables", label: "Ширээ удирдах", permission: Permission.TABLES },
  { id: "kitchen", label: "Гал тогоо харах", permission: Permission.KITCHEN },
  { id: "reports", label: "Тайлан харах", permission: Permission.REPORTS },
  {
    id: "inventory",
    label: "Inventory удирдах",
    permission: Permission.MENU,
  },
  { id: "staff", label: "Ажилтан удирдах", permission: Permission.STAFF },
  {
    id: "settings",
    label: "Тохиргоо өөрчлөх",
    permission: Permission.SETTINGS,
  },
  {
    id: "platform",
    label: "Platform restaurant удирдах",
    permission: Permission.PLATFORM,
  },
] as const;

export const PLAN_LABELS_MN: Record<RestaurantPlan, string> = {
  [RestaurantPlan.STARTER]: "Starter",
  [RestaurantPlan.BUSINESS]: "Business",
  [RestaurantPlan.ENTERPRISE]: "Enterprise",
};

export const SUBSCRIPTION_LABELS_MN: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.ACTIVE]: "Идэвхтэй",
  [SubscriptionStatus.EXPIRED]: "Хугацаа дууссан",
  [SubscriptionStatus.SUSPENDED]: "Түдгэлзүүлсэн",
};

export function getAccountTypeLabel(role: UserRole): string {
  if (role === UserRole.PLATFORM_OWNER) {
    return "Platform owner POS данс";
  }
  return "Рестораны POS данс";
}

export function splitProfileCapabilities(user: Pick<IUser, "role" | "permissions">): {
  allowed: string[];
  denied: string[];
} {
  const seenAllowed = new Set<string>();
  const seenDenied = new Set<string>();
  const allowed: string[] = [];
  const denied: string[] = [];

  for (const action of PROFILE_ACTIONS) {
    const hasAccess = userHasPermission(user, action.permission);
    const bucket = hasAccess ? seenAllowed : seenDenied;
    const target = hasAccess ? allowed : denied;

    if (bucket.has(action.label)) {
      continue;
    }
    bucket.add(action.label);
    target.push(action.label);
  }

  return { allowed, denied };
}

export function formatRestaurantSummary(restaurant: IRestaurant | null) {
  if (!restaurant) {
    return null;
  }

  return {
    id: String(restaurant._id),
    name: restaurant.name,
    plan: restaurant.plan,
    planLabel: PLAN_LABELS_MN[restaurant.plan] ?? restaurant.plan,
    subscriptionStatus: restaurant.subscriptionStatus,
    subscriptionLabel:
      SUBSCRIPTION_LABELS_MN[restaurant.subscriptionStatus] ??
      restaurant.subscriptionStatus,
    expireDate: restaurant.expireDate
      ? new Date(restaurant.expireDate).toISOString()
      : null,
    isActive: restaurant.isActive,
  };
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS_MN[role] ?? role;
}

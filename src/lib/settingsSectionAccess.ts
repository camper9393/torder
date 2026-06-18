import { UserRole } from "@/constants/userRoles";
import {
  canAccessStaffManagement,
  Permission,
  userHasPermission,
} from "@/lib/permissions";
import type { IUser } from "@/model/user";
import type { SettingsNavKey } from "@/components/Admin/Settings/settingsNavConfig";

export const SETTINGS_SECTION_DENIED_MESSAGE =
  "Танд энэ хэсэгт хандах эрх байхгүй";

export type SettingsSectionUser = Pick<IUser, "role" | "permissions">;

/** Platform owner болон рестораны эзэмшигч — бүх тохиргооны хэсэг */
export function isSettingsFullAccessRole(
  user: Pick<IUser, "role">
): boolean {
  return (
    user.role === UserRole.PLATFORM_OWNER ||
    user.role === UserRole.RESTAURANT_OWNER
  );
}

export function canAccessSettingsSection(
  user: SettingsSectionUser,
  key: SettingsNavKey
): boolean {
  if (isSettingsFullAccessRole(user)) {
    return true;
  }

  switch (key) {
    case "users":
      return true;
    case "staff":
      return canAccessStaffManagement(user);
    case "payments":
      return (
        userHasPermission(user, Permission.SETTINGS) ||
        userHasPermission(user, Permission.PAYMENTS)
      );
    case "receipt":
    case "company":
    case "branches":
    case "vat":
    case "audit":
    case "subscription":
      return userHasPermission(user, Permission.SETTINGS);
    default:
      return userHasPermission(user, Permission.SETTINGS);
  }
}

export function canAccessAnySettingsSection(user: SettingsSectionUser): boolean {
  const keys: SettingsNavKey[] = [
    "company",
    "branches",
    "staff",
    "users",
    "payments",
    "receipt",
    "vat",
    "audit",
    "subscription",
  ];
  return keys.some((key) => canAccessSettingsSection(user, key));
}

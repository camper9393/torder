import StaffSettingsSection from "@/components/Admin/Settings/sections/StaffSettingsSection";
import SettingsAccessBlocked from "@/components/Admin/Settings/SettingsAccessBlocked";
import { getSettingsSectionPageAccess } from "@/lib/settingsPageGuard";
import type { PublicUser } from "@/service/userAuth";

function toClientPublicUser(user: PublicUser): PublicUser {
  return {
    _id: String(user._id),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId ? String(user.restaurantId) : undefined,
    permissions: [...user.permissions],
    isActive: user.isActive,
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt).toISOString(),
  } as unknown as PublicUser;
}

export default async function StaffSettingsPage() {
  const { user, allowed } = await getSettingsSectionPageAccess(
    "staff",
    "/admin/settings/staff"
  );
  if (!allowed) return <SettingsAccessBlocked />;
  return (
    <StaffSettingsSection currentUser={toClientPublicUser(user)} />
  );
}

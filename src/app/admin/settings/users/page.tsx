import AdminProfilePage from "@/components/Admin/Profile";
import { getSettingsSectionPageAccess } from "@/lib/settingsPageGuard";

export default async function SettingsUsersPage() {
  await getSettingsSectionPageAccess("users", "/admin/settings/users");
  return <AdminProfilePage />;
}

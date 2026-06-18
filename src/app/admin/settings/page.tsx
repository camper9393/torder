import { redirect } from "next/navigation";
import { SETTINGS_NAV_ITEMS } from "@/components/Admin/Settings/settingsNavConfig";
import { getCurrentPublicUser } from "@/lib/auth";
import { canAccessSettingsSection } from "@/lib/settingsSectionAccess";

export default async function AdminSettingsIndexPage() {
  const user = await getCurrentPublicUser();
  if (!user) {
    redirect("/login?next=/admin/settings");
  }

  const firstAllowed = SETTINGS_NAV_ITEMS.find((item) =>
    canAccessSettingsSection(user, item.key)
  );

  redirect(firstAllowed?.href ?? "/admin/settings/users");
}

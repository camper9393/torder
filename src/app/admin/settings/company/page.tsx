import CompanySettingsSection from "@/components/Admin/Settings/sections/CompanySettingsSection";
import SettingsAccessBlocked from "@/components/Admin/Settings/SettingsAccessBlocked";
import { getSettingsSectionPageAccess } from "@/lib/settingsPageGuard";

export default async function CompanySettingsPage() {
  const { allowed } = await getSettingsSectionPageAccess(
    "company",
    "/admin/settings/company"
  );
  if (!allowed) return <SettingsAccessBlocked />;
  return <CompanySettingsSection />;
}

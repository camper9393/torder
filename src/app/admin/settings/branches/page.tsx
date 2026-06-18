import BranchesSection from "@/components/Admin/Settings/sections/BranchesSection";
import SettingsAccessBlocked from "@/components/Admin/Settings/SettingsAccessBlocked";
import { getSettingsSectionPageAccess } from "@/lib/settingsPageGuard";

export default async function BranchesSettingsPage() {
  const { allowed } = await getSettingsSectionPageAccess(
    "branches",
    "/admin/settings/branches"
  );
  if (!allowed) return <SettingsAccessBlocked />;
  return <BranchesSection />;
}

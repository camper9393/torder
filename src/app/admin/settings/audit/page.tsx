import AuditLogSection from "@/components/Admin/Settings/sections/AuditLogSection";
import SettingsAccessBlocked from "@/components/Admin/Settings/SettingsAccessBlocked";
import { getSettingsSectionPageAccess } from "@/lib/settingsPageGuard";

export default async function AuditSettingsPage() {
  const { allowed } = await getSettingsSectionPageAccess(
    "audit",
    "/admin/settings/audit"
  );
  if (!allowed) return <SettingsAccessBlocked />;
  return <AuditLogSection />;
}

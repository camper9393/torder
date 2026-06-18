import VatSection from "@/components/Admin/Settings/sections/VatSection";
import SettingsAccessBlocked from "@/components/Admin/Settings/SettingsAccessBlocked";
import { getSettingsSectionPageAccess } from "@/lib/settingsPageGuard";

export default async function VatSettingsPage() {
  const { allowed } = await getSettingsSectionPageAccess(
    "vat",
    "/admin/settings/vat"
  );
  if (!allowed) return <SettingsAccessBlocked />;
  return <VatSection />;
}

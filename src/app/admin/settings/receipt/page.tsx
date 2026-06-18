import ReceiptSection from "@/components/Admin/Settings/sections/ReceiptSection";
import SettingsAccessBlocked from "@/components/Admin/Settings/SettingsAccessBlocked";
import { getSettingsSectionPageAccess } from "@/lib/settingsPageGuard";

export default async function ReceiptSettingsPage() {
  const { allowed } = await getSettingsSectionPageAccess(
    "receipt",
    "/admin/settings/receipt"
  );
  if (!allowed) return <SettingsAccessBlocked />;
  return <ReceiptSection />;
}

import PaymentsSection from "@/components/Admin/Settings/sections/PaymentsSection";
import SettingsAccessBlocked from "@/components/Admin/Settings/SettingsAccessBlocked";
import { getSettingsSectionPageAccess } from "@/lib/settingsPageGuard";

export default async function PaymentsSettingsPage() {
  const { allowed } = await getSettingsSectionPageAccess(
    "payments",
    "/admin/settings/payments"
  );
  if (!allowed) return <SettingsAccessBlocked />;
  return <PaymentsSection />;
}

import SubscriptionSection from "@/components/Admin/Settings/sections/SubscriptionSection";
import SettingsAccessBlocked from "@/components/Admin/Settings/SettingsAccessBlocked";
import { getSettingsSectionPageAccess } from "@/lib/settingsPageGuard";

export default async function SubscriptionSettingsPage() {
  const { allowed } = await getSettingsSectionPageAccess(
    "subscription",
    "/admin/settings/subscription"
  );
  if (!allowed) return <SettingsAccessBlocked />;
  return <SubscriptionSection />;
}

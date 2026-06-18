import { getCurrentPublicUser } from "@/lib/auth";
import {
  canAccessSettingsSection,
} from "@/lib/settingsSectionAccess";
import type { SettingsNavKey } from "@/components/Admin/Settings/settingsNavConfig";
import type { PublicUser } from "@/service/userAuth";
import { redirect } from "next/navigation";

export type SettingsSectionPageAccess = {
  user: PublicUser;
  allowed: boolean;
};

export async function getSettingsSectionPageAccess(
  sectionKey: SettingsNavKey,
  nextPath: string
): Promise<SettingsSectionPageAccess> {
  const user = await getCurrentPublicUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return {
    user,
    allowed: canAccessSettingsSection(user, sectionKey),
  };
}

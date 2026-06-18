import { getCurrentPublicUser } from "@/lib/auth";
import { getSettingsLayoutContext } from "@/lib/settingsAuth";
import SettingsShell from "@/components/Admin/Settings/SettingsShell";
import { redirect } from "next/navigation";

export default async function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentPublicUser();
  if (!user) {
    redirect("/login?next=/admin/settings");
  }

  const { isPlatformOwner, sessionRestaurantId } =
    await getSettingsLayoutContext();

  return (
    <SettingsShell
      isPlatformOwner={isPlatformOwner}
      sessionRestaurantId={sessionRestaurantId}
    >
      {children}
    </SettingsShell>
  );
}

import { getCurrentPublicUser } from "@/lib/auth";
import { canAccessStaffManagement } from "@/lib/permissions";
import { redirect } from "next/navigation";

export async function requireStaffManagementPage(nextPath: string) {
  const user = await getCurrentPublicUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!canAccessStaffManagement(user)) {
    redirect("/login?error=forbidden");
  }

  return user;
}

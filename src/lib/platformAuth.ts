import { getCurrentPublicUser } from "@/lib/auth";
import { UserRole } from "@/model/user";
import { redirect } from "next/navigation";

export async function requirePlatformOwnerPage(nextPath: string) {
  const user = await getCurrentPublicUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (user.role !== UserRole.PLATFORM_OWNER) {
    redirect("/login?error=forbidden");
  }

  return user;
}

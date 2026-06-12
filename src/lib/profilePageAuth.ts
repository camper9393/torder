import { getCurrentPublicUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireProfilePage(nextPath: string) {
  const user = await getCurrentPublicUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

import { requirePlatformOwnerPage } from "@/lib/platformAuth";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformOwnerPage("/platform/dashboard");
  return children;
}

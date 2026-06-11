import { requirePlatformOwnerPage } from "@/lib/platformAuth";

export default async function PlatformRestaurantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformOwnerPage("/platform/restaurants");
  return <div className="min-h-svh bg-[#F8F5F0]">{children}</div>;
}

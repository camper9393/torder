import RestaurantDetailPage from "@/components/Platform/Restaurants/RestaurantDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlatformRestaurantDetailRoutePage({
  params,
}: PageProps) {
  const { id } = await params;
  return <RestaurantDetailPage id={id} />;
}

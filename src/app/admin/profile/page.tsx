import AdminProfilePage from "@/components/Admin/Profile";
import { requireProfilePage } from "@/lib/profilePageAuth";

export default async function AdminProfileRoutePage() {
  await requireProfilePage("/admin/profile");
  return <AdminProfilePage />;
}

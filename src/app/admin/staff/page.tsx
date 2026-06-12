import AdminStaffPage from "@/components/Admin/Staff";
import { requireStaffManagementPage } from "@/lib/staffPageAuth";
import type { PublicUser } from "@/service/userAuth";

/** Server → Client props: Mongoose ObjectId/Date-ийг энгийн string болгоно */
function toClientPublicUser(user: PublicUser): PublicUser {
  return {
    _id: String(user._id),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId ? String(user.restaurantId) : undefined,
    permissions: [...user.permissions],
    isActive: user.isActive,
    createdAt: new Date(user.createdAt).toISOString(),
    updatedAt: new Date(user.updatedAt).toISOString(),
  } as unknown as PublicUser;
}

export default async function AdminStaffRoutePage() {
  const user = await requireStaffManagementPage("/admin/staff");
  return <AdminStaffPage currentUser={toClientPublicUser(user)} />;
}

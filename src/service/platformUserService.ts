import mongoServer from "@/config/mongoConfig";
import { assignableRolesFor } from "@/lib/permissions";
import { logActivity } from "@/service/activityLogService";
import { Restaurant } from "@/model/restaurant";
import { IUser, User, UserRole } from "@/model/user";
import {
  createStaffUser,
  resetStaffPassword,
  updateStaffUser,
} from "@/service/staffService";
import { toPublicUser } from "@/service/userAuth";
import { serializePublicUser } from "@/utils/platformSerialize";
import mongoose, { Types } from "mongoose";

export type PlatformUserFilters = {
  role?: UserRole;
  restaurantId?: string;
  active?: boolean;
  search?: string;
};

export async function listPlatformUsers(filters: PlatformUserFilters = {}) {
  await mongoServer();

  const query: Record<string, unknown> = {
    role: { $ne: UserRole.PLATFORM_OWNER },
  };

  if (filters.role) query.role = filters.role;
  if (filters.restaurantId && mongoose.isValidObjectId(filters.restaurantId)) {
    query.restaurantId = new Types.ObjectId(filters.restaurantId);
  }
  if (filters.active === true) query.isActive = true;
  if (filters.active === false) query.isActive = false;

  let users = await User.find(query).sort({ createdAt: -1 }).limit(500).lean();

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
    );
  }

  const restaurantIds = [
    ...new Set(users.map((u) => u.restaurantId).filter(Boolean).map(String)),
  ];
  const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
    .select("name")
    .lean();
  const nameMap = new Map(restaurants.map((r) => [String(r._id), r.name]));

  return users.map((u) => ({
    ...serializePublicUser(u),
    restaurantName: u.restaurantId
      ? nameMap.get(String(u.restaurantId))
      : undefined,
  }));
}

export async function updatePlatformUser(
  actor: IUser,
  userId: string,
  input: { name?: string; email?: string; role?: UserRole; isActive?: boolean }
) {
  if (String(actor._id) === userId) {
    if (input.role && input.role !== UserRole.PLATFORM_OWNER) {
      throw new Error("Өөрийн platform owner эрхийг бууруулах боломжгүй");
    }
    if (input.isActive === false) {
      throw new Error("Өөрийгөө идэвхгүй болгох боломжгүй");
    }
  }

  const updated = await updateStaffUser(actor, userId, input);
  if (!updated) return null;

  await logActivity({
    actorUserId: actor._id,
    actorRole: actor.role,
    restaurantId: updated.restaurantId
      ? new Types.ObjectId(String(updated.restaurantId))
      : undefined,
    action: "user.updated",
    targetType: "user",
    targetId: String(updated._id),
    message: `Хэрэглэгч шинэчлэгдлээ: ${updated.name}`,
  });

  return serializePublicUser(updated);
}

export async function resetPlatformUserPassword(
  actor: IUser,
  userId: string,
  newPassword: string
) {
  const ok = await resetStaffPassword(actor, userId, newPassword);
  if (!ok) return false;

  await logActivity({
    actorUserId: actor._id,
    actorRole: actor.role,
    action: "user.password_reset",
    targetType: "user",
    targetId: userId,
    message: "Platform owner нууц үг шинэчиллээ",
  });

  return true;
}

export async function createPlatformUser(
  actor: IUser,
  input: {
    name: string;
    email: string;
    username: string;
    password: string;
    role: UserRole;
    restaurantId: string;
  }
) {
  await mongoServer();

  if (!mongoose.isValidObjectId(input.restaurantId)) {
    throw new Error("Буруу рестораны ID");
  }

  const restaurant = await Restaurant.findById(input.restaurantId).select("_id");
  if (!restaurant) {
    throw new Error("Ресторан олдсонгүй");
  }

  const created = await createStaffUser(actor, {
    name: input.name,
    email: input.email,
    username: input.username,
    password: input.password,
    role: input.role,
    restaurantId: new Types.ObjectId(input.restaurantId),
  });

  await logActivity({
    actorUserId: actor._id,
    actorRole: actor.role,
    restaurantId: new Types.ObjectId(input.restaurantId),
    action: "user.created",
    targetType: "user",
    targetId: String(created._id),
    message: `Хэрэглэгч үүсгэлээ: ${created.name}`,
  });

  return created;
}

export async function deletePlatformUser(actor: IUser, userId: string) {
  await mongoServer();

  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("Буруу хэрэглэгчийн ID");
  }

  if (String(actor._id) === userId) {
    throw new Error("Өөрийгөө устгах боломжгүй");
  }

  const target = await User.findById(userId);
  if (!target) return null;

  if (target.role === UserRole.PLATFORM_OWNER) {
    throw new Error("Platform owner-г устгах боломжгүй");
  }

  await User.findByIdAndDelete(userId);

  await logActivity({
    actorUserId: actor._id,
    actorRole: actor.role,
    restaurantId: target.restaurantId
      ? new Types.ObjectId(String(target.restaurantId))
      : undefined,
    action: "user.deleted",
    targetType: "user",
    targetId: userId,
    message: `Хэрэглэгч устгагдлаа: ${target.name}`,
  });

  return { name: target.name };
}

export function platformAssignableRoles(actor: IUser): UserRole[] {
  return assignableRolesFor(actor);
}

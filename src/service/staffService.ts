import bcrypt from "bcrypt";
import mongoose, { Types } from "mongoose";
import mongoServer from "@/config/mongoConfig";
import {
  assignableRolesFor,
  canAssignRole,
  canManageStaffMember,
} from "@/lib/permissions";
import { Restaurant } from "@/model/restaurant";
import { IUser, User, UserRole } from "@/model/user";
import { toPublicUser, type PublicUser } from "@/service/userAuth";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

export type CreateStaffInput = {
  name: string;
  email: string;
  username: string;
  password: string;
  role: UserRole;
  restaurantId: Types.ObjectId;
};

export type UpdateStaffInput = {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function validatePassword(password: string): void {
  if (!password || password.length < 6) {
    throw new Error("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
  }
}

async function assertUnderMaxUsers(restaurantId: Types.ObjectId): Promise<void> {
  const restaurant = await Restaurant.findById(restaurantId).select("maxUsers");
  if (!restaurant) {
    throw new Error("Ресторан олдсонгүй");
  }
  const count = await User.countDocuments({ restaurantId, isActive: true });
  if (count >= restaurant.maxUsers) {
    throw new Error(
      `Хэрэглэгчийн дээд хязгаар (${restaurant.maxUsers}) хүрсэн байна`
    );
  }
}

export async function createStaffUser(
  actor: IUser,
  input: CreateStaffInput
): Promise<PublicUser> {
  await mongoServer();

  if (!canAssignRole(actor, input.role)) {
    throw new Error("Энэ үүрэг оноох эрхгүй байна");
  }

  if (input.role === UserRole.PLATFORM_OWNER) {
    throw new Error("Platform owner үүсгэх боломжгүй");
  }

  if (
    actor.role !== UserRole.PLATFORM_OWNER &&
    (!actor.restaurantId ||
      !input.restaurantId.equals(actor.restaurantId))
  ) {
    throw new Error("Өөр рестораны ажилтан үүсгэх боломжгүй");
  }

  await assertUnderMaxUsers(input.restaurantId);

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);
  validatePassword(input.password);

  if (!name || !email || !username) {
    throw new Error("Нэр, имэйл, хэрэглэгчийн нэр заавал шаардлагатай");
  }

  const existing = await User.findOne({
    $or: [{ email }, { username }],
  }).select("_id");
  if (existing) {
    throw new Error("Имэйл эсвэл хэрэглэгчийн нэр аль хэдийн бүртгэгдсэн байна");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    username,
    passwordHash,
    role: input.role,
    restaurantId: input.restaurantId,
    permissions: [],
    isActive: true,
  });

  return toPublicUser(user);
}

async function createRestaurantOwnerInternal(
  input: CreateStaffInput
): Promise<PublicUser> {
  await mongoServer();
  await assertUnderMaxUsers(input.restaurantId);

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);
  validatePassword(input.password);

  const existing = await User.findOne({
    $or: [{ email }, { username }],
  }).select("_id");
  if (existing) {
    throw new Error("Имэйл эсвэл хэрэглэгчийн нэр аль хэдийн бүртгэгдсэн байна");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    username,
    passwordHash,
    role: UserRole.RESTAURANT_OWNER,
    restaurantId: input.restaurantId,
    permissions: [],
    isActive: true,
  });

  return toPublicUser(user);
}

export async function provisionRestaurantOwner(
  restaurantId: Types.ObjectId,
  owner: {
    name: string;
    email: string;
    username: string;
    password: string;
  }
): Promise<PublicUser> {
  return createRestaurantOwnerInternal({
    name: owner.name,
    email: owner.email,
    username: owner.username,
    password: owner.password,
    role: UserRole.RESTAURANT_OWNER,
    restaurantId,
  });
}

export async function listStaffForRestaurant(
  restaurantId: Types.ObjectId
): Promise<PublicUser[]> {
  await mongoServer();
  const users = await User.find({ restaurantId })
    .sort({ role: 1, name: 1 })
    .lean();
  return users.map((u) => toPublicUser(u as IUser));
}

export async function getStaffUser(
  userId: string | Types.ObjectId
): Promise<IUser | null> {
  await mongoServer();
  if (!mongoose.isValidObjectId(userId)) return null;
  return User.findById(userId);
}

export async function updateStaffUser(
  actor: IUser,
  userId: string | Types.ObjectId,
  input: UpdateStaffInput
): Promise<PublicUser | null> {
  await mongoServer();

  const target = await User.findById(userId);
  if (!target || target.role === UserRole.PLATFORM_OWNER) {
    return null;
  }

  if (!canManageStaffMember(actor, target)) {
    throw new Error("Энэ ажилтны мэдээлэл засах эрхгүй");
  }

  const updates: UpdateStaffInput = {};

  if (input.role !== undefined) {
    if (!canAssignRole(actor, input.role)) {
      throw new Error("Энэ үүрэг оноох эрхгүй");
    }
    if (input.role === UserRole.PLATFORM_OWNER) {
      throw new Error("Platform owner үүрэг оноох боломжгүй");
    }
    updates.role = input.role;
  }

  if (typeof input.name === "string") {
    const name = input.name.trim();
    if (!name) throw new Error("Нэр хоосон байж болохгүй");
    updates.name = name;
  }

  if (typeof input.email === "string") {
    const email = normalizeEmail(input.email);
    if (!email) throw new Error("Имэйл хоосон байж болохгүй");
    const dup = await User.findOne({
      email,
      _id: { $ne: target._id },
    }).select("_id");
    if (dup) throw new Error("Имэйл аль хэдийн бүртгэгдсэн байна");
    updates.email = email;
  }

  if (typeof input.isActive === "boolean") {
    if (!input.isActive && String(target._id) === String(actor._id)) {
      throw new Error("Өөрийгөө идэвхгүй болгох боломжгүй");
    }
    updates.isActive = input.isActive;
  }

  Object.assign(target, updates);
  await target.save();
  return toPublicUser(target);
}

export async function resetStaffPassword(
  actor: IUser,
  userId: string | Types.ObjectId,
  newPassword: string
): Promise<boolean> {
  await mongoServer();

  const target = await User.findById(userId).select("+passwordHash");
  if (!target || target.role === UserRole.PLATFORM_OWNER) {
    return false;
  }

  if (!canManageStaffMember(actor, target)) {
    throw new Error("Нууц үг солих эрхгүй");
  }

  validatePassword(newPassword);
  target.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await target.save();
  return true;
}

export function staffRolesForActor(actor: Pick<IUser, "role">): UserRole[] {
  return assignableRolesFor(actor);
}

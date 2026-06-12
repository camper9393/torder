import bcrypt from "bcrypt";
import mongoServer from "@/config/mongoConfig";
import {
  formatRestaurantSummary,
  getAccountTypeLabel,
  getRoleLabel,
  splitProfileCapabilities,
} from "@/lib/profileCapabilities";
import { UserRole, type IUser, User } from "@/model/user";
import { Restaurant } from "@/model/restaurant";
import { toPublicUser, type PublicUser } from "@/service/userAuth";
import { Types } from "mongoose";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

export type ProfileView = {
  user: PublicUser;
  accountType: string;
  roleLabel: string;
  restaurant: ReturnType<typeof formatRestaurantSummary>;
  capabilities: {
    allowed: string[];
    denied: string[];
  };
  session: {
    restaurantName: string | null;
    role: UserRole;
    roleLabel: string;
    accountStatus: string;
    subscriptionExpiry: string | null;
  };
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validatePassword(password: string): void {
  if (!password || password.length < 6) {
    throw new Error("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
  }
}

async function resolveRestaurantForUser(user: IUser) {
  await mongoServer();

  if (user.restaurantId) {
    return Restaurant.findById(user.restaurantId).lean();
  }

  if (user.role === UserRole.PLATFORM_OWNER) {
    const { resolveDefaultLegacyRestaurantId } = await import("@/lib/tenant");
    const legacyId = await resolveDefaultLegacyRestaurantId();
    if (legacyId) {
      return Restaurant.findById(legacyId).lean();
    }
  }

  return null;
}

export async function buildProfileView(user: IUser): Promise<ProfileView> {
  const publicUser = toPublicUser(user);
  const restaurantDoc = await resolveRestaurantForUser(user);
  const restaurant = formatRestaurantSummary(restaurantDoc);
  const capabilities = splitProfileCapabilities(user);
  const roleLabel = getRoleLabel(user.role);

  return {
    user: publicUser,
    accountType: getAccountTypeLabel(user.role),
    roleLabel,
    restaurant,
    capabilities,
    session: {
      restaurantName: restaurant?.name ?? null,
      role: user.role,
      roleLabel,
      accountStatus: user.isActive ? "Идэвхтэй" : "Идэвхгүй",
      subscriptionExpiry: restaurant?.expireDate ?? null,
    },
  };
}

export async function changeOwnPassword(
  userId: Types.ObjectId,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  await mongoServer();

  if (!currentPassword) {
    throw new Error("Одоогийн нууц үгээ оруулна уу");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Шинэ нууц үг таарахгүй байна");
  }

  validatePassword(newPassword);

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new Error("Хэрэглэгч олдсонгүй");
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error("Одоогийн нууц үг буруу байна");
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();
}

export type UpdateOwnProfileInput = {
  name?: string;
  email?: string;
};

export async function updateOwnProfile(
  userId: Types.ObjectId,
  input: UpdateOwnProfileInput
): Promise<PublicUser> {
  await mongoServer();

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("Хэрэглэгч олдсонгүй");
  }

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      throw new Error("Нэр хоосон байж болохгүй");
    }
    user.name = name;
  }

  if (input.email !== undefined) {
    const email = normalizeEmail(input.email);
    if (!email) {
      throw new Error("Имэйл хоосон байж болохгүй");
    }

    const existing = await User.findOne({
      email,
      _id: { $ne: userId },
    }).select("_id");

    if (existing) {
      throw new Error("Энэ имэйл аль хэдийн бүртгэлтэй байна");
    }

    user.email = email;
  }

  await user.save();
  return toPublicUser(user);
}

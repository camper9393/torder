import bcrypt from "bcrypt";
import mongoose from "mongoose";
import mongoServer from "@/config/mongoConfig";
import { IUser, User, UserRole } from "@/model/user";
import { generateUserToken } from "@/utils/userJwt";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

export type PublicUser = Omit<IUser, "passwordHash">;

export function toPublicUser(user: IUser): PublicUser {
  const doc = typeof (user as { toObject?: () => IUser }).toObject === "function"
    ? (user as mongoose.Document & IUser).toObject()
    : { ...user };

  const { passwordHash: _passwordHash, ...publicUser } = doc as IUser;
  return publicUser;
}

export async function ensureInitialPlatformOwner(): Promise<boolean> {
  await mongoServer();

  const count = await User.countDocuments();
  if (count > 0) return false;

  const name = process.env.INITIAL_ADMIN_NAME?.trim();
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const username = process.env.INITIAL_ADMIN_USERNAME?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!name || !email || !username || !password) {
    return false;
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  await User.create({
    name,
    email,
    username,
    passwordHash,
    role: UserRole.PLATFORM_OWNER,
    permissions: [],
    isActive: true,
  });

  return true;
}

export async function loginUser(
  login: string,
  password: string
): Promise<{ user: PublicUser; token: string } | null> {
  await mongoServer();
  await ensureInitialPlatformOwner();

  const normalizedLogin = login.trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: normalizedLogin }, { username: normalizedLogin }],
  }).select("+passwordHash");

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const token = generateUserToken(user._id);
  if (!token) {
    return null;
  }

  return { user: toPublicUser(user), token };
}

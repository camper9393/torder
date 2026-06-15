import bcrypt from "bcrypt";
import mongoose from "mongoose";
import mongoServer from "@/config/mongoConfig";
import { IUser, User } from "@/model/user";
import { buildUserLoginResult, type PublicUser } from "@/service/userAuth";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

const PASSCODE_RE = /^\d{4}$/;

export function isValidPasscode(value: unknown): value is string {
  return typeof value === "string" && PASSCODE_RE.test(value);
}

/** Тухайн хэрэглэгчид pin код тохируулсан эсэх (frontend-д hash буцаахгүй) */
export async function getPasscodeStatus(
  userId: string | mongoose.Types.ObjectId
): Promise<{ enabled: boolean } | null> {
  await mongoServer();
  if (!mongoose.isValidObjectId(userId)) return null;
  const user = await User.findById(userId).select("passcodeEnabled");
  if (!user) return null;
  return { enabled: Boolean(user.passcodeEnabled) };
}

/**
 * Pin код тохируулах эсвэл солих.
 * Шинээр тохируулах үед одоогийн нууц үгээ батлана.
 * Солих үед одоогийн нууц үг ЭСВЭЛ одоогийн pin кодоо батална.
 */
export async function setPasscode(
  actorId: string | mongoose.Types.ObjectId,
  input: {
    newPasscode: string;
    currentPassword?: string;
    currentPasscode?: string;
  }
): Promise<{ ok: true } | { ok: false; message: string }> {
  await mongoServer();

  if (!isValidPasscode(input.newPasscode)) {
    return { ok: false, message: "4 оронтой пин код оруулна уу" };
  }

  const user = await User.findById(actorId).select(
    "+passwordHash +passcodeHash passcodeEnabled"
  );
  if (!user) {
    return { ok: false, message: "Хэрэглэгч олдсонгүй" };
  }

  const verified = await verifyCurrent(user, {
    currentPassword: input.currentPassword,
    currentPasscode: input.currentPasscode,
  });
  if (!verified.ok) return verified;

  user.passcodeHash = await bcrypt.hash(input.newPasscode, SALT_ROUNDS);
  user.passcodeEnabled = true;
  user.passcodeUpdatedAt = new Date();
  await user.save();

  return { ok: true };
}

/** Анх удаа pin код тохируулах — зөвхөн нэвтэрсэн, passcode идэвхгүй хэрэглэгч */
export async function setupInitialPasscode(
  actorId: string | mongoose.Types.ObjectId,
  newPasscode: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  await mongoServer();

  if (!isValidPasscode(newPasscode)) {
    return { ok: false, message: "4 оронтой пин код оруулна уу" };
  }

  const user = await User.findById(actorId).select(
    "+passcodeHash passcodeEnabled"
  );
  if (!user) {
    return { ok: false, message: "Хэрэглэгч олдсонгүй" };
  }

  if (user.passcodeEnabled) {
    return { ok: false, message: "Пин код аль хэдийн тохируулсан байна" };
  }

  user.passcodeHash = await bcrypt.hash(newPasscode, SALT_ROUNDS);
  user.passcodeEnabled = true;
  user.passcodeUpdatedAt = new Date();
  await user.save();

  return { ok: true };
}

/** Pin код устгах/идэвхгүй болгох (одоогийн нууц үг эсвэл pin-ээр батална) */
export async function removePasscode(
  actorId: string | mongoose.Types.ObjectId,
  input: { currentPassword?: string; currentPasscode?: string }
): Promise<{ ok: true } | { ok: false; message: string }> {
  await mongoServer();

  const user = await User.findById(actorId).select(
    "+passwordHash +passcodeHash passcodeEnabled"
  );
  if (!user) {
    return { ok: false, message: "Хэрэглэгч олдсонгүй" };
  }

  if (!user.passcodeEnabled) {
    return { ok: false, message: "Пин код тохируулаагүй байна" };
  }

  const verified = await verifyCurrent(user, input);
  if (!verified.ok) return verified;

  user.passcodeHash = undefined;
  user.passcodeEnabled = false;
  user.passcodeUpdatedAt = new Date();
  await user.save();

  return { ok: true };
}

/** Pin кодоор нэвтрэх — серверт баталгаажуулна */
export async function loginWithPasscode(
  userId: string,
  passcode: string
): Promise<
  | { ok: true; user: PublicUser; token: string }
  | { ok: false; status: number; message: string }
> {
  await mongoServer();

  if (!mongoose.isValidObjectId(userId)) {
    return { ok: false, status: 404, message: "Хэрэглэгч олдсонгүй" };
  }
  if (!isValidPasscode(passcode)) {
    return { ok: false, status: 400, message: "4 оронтой пин код оруулна уу" };
  }

  const user = await User.findById(userId).select(
    "+passcodeHash passcodeEnabled isActive"
  );

  if (!user || !user.isActive) {
    return { ok: false, status: 404, message: "Хэрэглэгч олдсонгүй" };
  }
  if (!user.passcodeEnabled || !user.passcodeHash) {
    return { ok: false, status: 400, message: "Пин код тохируулаагүй байна" };
  }

  const valid = await bcrypt.compare(passcode, user.passcodeHash);
  if (!valid) {
    return { ok: false, status: 401, message: "Пин код буруу байна" };
  }

  const fullUser = await User.findById(userId);
  if (!fullUser || !fullUser.isActive) {
    return { ok: false, status: 404, message: "Хэрэглэгч олдсонгүй" };
  }

  const loginResult = buildUserLoginResult(fullUser);
  if (!loginResult) {
    return { ok: false, status: 500, message: "Серверийн алдаа гарлаа" };
  }

  return { ok: true, user: loginResult.user, token: loginResult.token };
}

/** Одоогийн нууц үг эсвэл pin кодоор баталгаажуулна */
async function verifyCurrent(
  user: IUser,
  input: { currentPassword?: string; currentPasscode?: string }
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (input.currentPassword) {
    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (valid) return { ok: true };
    return { ok: false, message: "Нууц үг буруу байна" };
  }

  if (input.currentPasscode && user.passcodeHash) {
    const valid = await bcrypt.compare(input.currentPasscode, user.passcodeHash);
    if (valid) return { ok: true };
    return { ok: false, message: "Пин код буруу байна" };
  }

  return {
    ok: false,
    message: "Одоогийн нууц үг эсвэл пин кодоо оруулна уу",
  };
}

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import mongoServer from "@/config/mongoConfig";
import { IUser, User, UserRole } from "@/model/user";
import { toPublicUser, type PublicUser } from "@/service/userAuth";
import { verifyUserToken } from "@/utils/userJwt";

export const USER_TOKEN_COOKIE = "user_token";

function getTokenFromRequest(req?: NextRequest): string | undefined {
  if (req) {
    return req.cookies.get(USER_TOKEN_COOKIE)?.value;
  }
  return undefined;
}

export async function getCurrentUser(req?: NextRequest): Promise<IUser | null> {
  await mongoServer();

  const token =
    getTokenFromRequest(req) ?? (await cookies()).get(USER_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const userId = verifyUserToken(token);
  if (!userId) {
    return null;
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export async function getCurrentPublicUser(
  req?: NextRequest
): Promise<PublicUser | null> {
  const user = await getCurrentUser(req);
  return user ? toPublicUser(user) : null;
}

export async function requireAuth(
  req: NextRequest
): Promise<IUser | NextResponse> {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Нэвтрэх шаардлагатай" },
      { status: 401 }
    );
  }

  return user;
}

export function hasRole(
  user: Pick<IUser, "role">,
  roles: UserRole | UserRole[]
): boolean {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(user.role);
}

export function hasPermission(
  user: Pick<IUser, "permissions">,
  permission: string
): boolean {
  return user.permissions.includes(permission);
}

export async function requirePlatformOwner(
  req: NextRequest
): Promise<IUser | NextResponse> {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!hasRole(authResult, UserRole.PLATFORM_OWNER)) {
    return NextResponse.json(
      { success: false, message: "Зөвхөн platform owner хандах эрхтэй" },
      { status: 403 }
    );
  }

  return authResult;
}

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import mongoServer from "@/config/mongoConfig";
import { canAccessStaffManagement } from "@/lib/permissions";
import { IUser, User, UserRole } from "@/model/user";
import { toPublicUser, type PublicUser } from "@/service/userAuth";
import { verifyUserToken } from "@/utils/userJwt";
import { isValidObjectId, Types } from "mongoose";

export const USER_TOKEN_COOKIE = "user_token";
/** Хуучин POS / merchant signin cookie (verifyAuth, session) */
export const MERCHANT_TOKEN_COOKIE = "token";

const LOGIN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

function getTokenFromRequest(req?: NextRequest): string | undefined {
  if (req) {
    return req.cookies.get(USER_TOKEN_COOKIE)?.value;
  }
  return undefined;
}

export async function getCurrentUser(req?: NextRequest): Promise<IUser | null> {
  await mongoServer();

  const userTokenFromReq = getTokenFromRequest(req);
  const userTokenFromStore = req
    ? undefined
    : (await cookies()).get(USER_TOKEN_COOKIE)?.value;

  const token = userTokenFromReq ?? userTokenFromStore;
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

export async function requireRoles(
  req: NextRequest,
  roles: UserRole | UserRole[]
): Promise<IUser | NextResponse> {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!hasRole(authResult, roles)) {
    return NextResponse.json(
      { success: false, message: "Хандах эрхгүй" },
      { status: 403 }
    );
  }

  return authResult;
}

export async function requireStaffManager(
  req: NextRequest
): Promise<IUser | NextResponse> {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!canAccessStaffManagement(authResult)) {
    return NextResponse.json(
      { success: false, message: "Ажилтан удирдах эрхгүй" },
      { status: 403 }
    );
  }

  return authResult;
}

/** Resolve which restaurant's staff the actor may access */
export async function resolveStaffRestaurantId(
  req: NextRequest,
  actor: IUser,
  queryRestaurantId?: string | null
): Promise<Types.ObjectId | NextResponse> {
  if (actor.role === UserRole.PLATFORM_OWNER) {
    if (queryRestaurantId && isValidObjectId(queryRestaurantId)) {
      return new Types.ObjectId(queryRestaurantId);
    }
    const { resolveDefaultLegacyRestaurantId } = await import("@/lib/tenant");
    const legacyId = await resolveDefaultLegacyRestaurantId();
    if (legacyId) return legacyId;
    return NextResponse.json(
      { success: false, message: "restaurantId заавал шаардлагатай" },
      { status: 400 }
    );
  }

  if (!actor.restaurantId) {
    return NextResponse.json(
      { success: false, message: "Ресторанд хамаарахгүй хэрэглэгч" },
      { status: 403 }
    );
  }

  if (
    queryRestaurantId &&
    isValidObjectId(queryRestaurantId) &&
    String(actor.restaurantId) !== queryRestaurantId
  ) {
    return NextResponse.json(
      { success: false, message: "Өөр рестораны ажилтан харах эрхгүй" },
      { status: 403 }
    );
  }

  return new Types.ObjectId(String(actor.restaurantId));
}

/** User login-ийн дараа POS merchant JWT үүсгэх (session route-той ижил логик) */
export async function resolveMerchantTokenForLoginUser(
  user: Pick<IUser, "role" | "restaurantId">
): Promise<string | null> {
  const {
    isPlatformOwner,
    resolveDefaultLegacyRestaurantId,
    resolveMerchantIdForRestaurant,
  } = await import("@/lib/tenant");
  const { tokenGenerator } = await import("@/utils/jwt");
  const { Merchants } = await import("@/model/merchants");

  let restaurantId: Types.ObjectId | null = user.restaurantId
    ? new Types.ObjectId(String(user.restaurantId))
    : null;

  if (!restaurantId && isPlatformOwner(user)) {
    restaurantId = await resolveDefaultLegacyRestaurantId();
  }
  if (!restaurantId) {
    return null;
  }

  const merchantId = await resolveMerchantIdForRestaurant(restaurantId);
  if (!merchantId) {
    return null;
  }

  const merchant = await Merchants.findById(merchantId).select("uid").lean();
  if (!merchant?.uid) {
    return null;
  }

  return tokenGenerator({ merchantId, uid: merchant.uid });
}

/**
 * Email / PIN login cookie — user_token + POS merchant token (хоёуланг ижил тохиргоо).
 */
export async function applyUserLoginCookies(
  res: NextResponse,
  userToken: string,
  user?: Pick<IUser, "role" | "restaurantId"> | null
): Promise<void> {
  res.cookies.set(USER_TOKEN_COOKIE, userToken, LOGIN_COOKIE_OPTIONS);

  if (!user) {
    return;
  }

  const merchantToken = await resolveMerchantTokenForLoginUser(user);
  if (merchantToken) {
    res.cookies.set(MERCHANT_TOKEN_COOKIE, merchantToken, LOGIN_COOKIE_OPTIONS);
  }
}

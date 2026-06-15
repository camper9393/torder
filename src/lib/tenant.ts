import { getCurrentUser, MERCHANT_TOKEN_COOKIE } from "@/lib/auth";
import { type PermissionKey, userHasPermission } from "@/lib/permissions";
import mongoServer from "@/config/mongoConfig";
import { IRestaurant, Restaurant } from "@/model/restaurant";
import { IUser, UserRole } from "@/model/user";
import { Menu } from "@/model/menu";
import { Order } from "@/model/order";
import { Merchants } from "@/model/merchants";
import { verifyAuth } from "@/middleware/auth";
import { verifyToken } from "@/utils/jwt";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";

export type PosScopeOptions = {
  permission?: PermissionKey;
};

export type TenantScope = {
  user: IUser | null;
  isPlatformOwner: boolean;
  restaurantId: Types.ObjectId | null;
  merchantId: Types.ObjectId | null;
};

export function isPlatformOwner(
  user: Pick<IUser, "role"> | null | undefined
): boolean {
  return user?.role === UserRole.PLATFORM_OWNER;
}

export async function resolveDefaultLegacyRestaurantId(): Promise<Types.ObjectId | null> {
  const { getDefaultRestaurantId } = await import("@/service/restaurantMigration");
  return getDefaultRestaurantId();
}

export async function resolveLegacyMerchantIdForRestaurant(
  restaurantId: Types.ObjectId
): Promise<Types.ObjectId | null> {
  await mongoServer();

  const menu = await Menu.findOne({ restaurantId }).select("merchantId").lean();
  if (menu?.merchantId) {
    return new Types.ObjectId(String(menu.merchantId));
  }

  const order = await Order.findOne({ restaurantId }).select("merchantId").lean();
  if (order?.merchantId) {
    return new Types.ObjectId(String(order.merchantId));
  }

  return null;
}

async function ensureMerchantForRestaurant(
  restaurantId: Types.ObjectId
): Promise<Types.ObjectId | null> {
  const restaurant = await Restaurant.findById(restaurantId).lean();
  if (!restaurant) {
    return null;
  }

  const { Merchants, IROLE } = await import("@/model/merchants");
  const bcrypt = await import("bcrypt");
  const uid = `r-${restaurant.slug || restaurantId.toHexString()}`;

  const byUid = await Merchants.findOne({ uid }).select("_id").lean();
  if (byUid?._id) {
    return new Types.ObjectId(String(byUid._id));
  }

  const email =
    restaurant.email?.trim() || `${uid.replace(/[^a-z0-9-]/gi, "")}@restaurant.local`;
  const byEmail = await Merchants.findOne({ email }).select("_id").lean();
  if (byEmail?._id) {
    return new Types.ObjectId(String(byEmail._id));
  }

  const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(
    `pos-bridge-${restaurantId.toHexString()}`,
    saltRounds
  );

  const created = await Merchants.create({
    name: restaurant.name,
    email,
    uid,
    password: passwordHash,
    role: IROLE.MERCHANT,
  });

  return created._id;
}

/** restaurantId → merchantId (өгөгдөлөөс хайх, шаардлагатай бол merchant үүсгэнэ) */
export async function resolveMerchantIdForRestaurant(
  restaurantId: Types.ObjectId
): Promise<Types.ObjectId | null> {
  await mongoServer();

  const fromLegacy = await resolveLegacyMerchantIdForRestaurant(restaurantId);
  if (fromLegacy) {
    return fromLegacy;
  }

  const { TableLayout } = await import("@/model/tableLayout");
  const layout = await TableLayout.findOne({ restaurantId })
    .select("merchantId")
    .lean();
  if (layout?.merchantId) {
    return new Types.ObjectId(String(layout.merchantId));
  }

  const { MenuOrder } = await import("@/model/menuOrder");
  const menuOrder = await MenuOrder.findOne({ restaurantId })
    .select("merchantId")
    .lean();
  if (menuOrder?.merchantId) {
    return new Types.ObjectId(String(menuOrder.merchantId));
  }

  return ensureMerchantForRestaurant(restaurantId);
}

export async function getCurrentRestaurant(
  req?: NextRequest
): Promise<IRestaurant | null> {
  const user = await getCurrentUser(req);
  await mongoServer();

  if (user?.restaurantId) {
    return Restaurant.findById(user.restaurantId);
  }

  if (user && isPlatformOwner(user)) {
    const defaultRestaurantId = await resolveDefaultLegacyRestaurantId();
    if (defaultRestaurantId) {
      return Restaurant.findById(defaultRestaurantId);
    }
  }

  return null;
}

export async function requireRestaurant(
  req: NextRequest
): Promise<Types.ObjectId | NextResponse> {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Нэвтрэх шаардлагатай" },
      { status: 401 }
    );
  }

  if (isPlatformOwner(user)) {
    return NextResponse.json(
      { success: false, message: "Platform owner-д restaurant scope шаардлагагүй" },
      { status: 400 }
    );
  }

  if (!user.restaurantId) {
    return NextResponse.json(
      { success: false, message: "Ресторанд хамаарахгүй хэрэглэгч" },
      { status: 403 }
    );
  }

  return user.restaurantId;
}

export async function resolveRestaurantIdForMerchant(
  merchantId: Types.ObjectId
): Promise<Types.ObjectId | null> {
  await mongoServer();

  const menu = await Menu.findOne({ merchantId }).select("restaurantId").lean();
  if (menu?.restaurantId) {
    return new Types.ObjectId(String(menu.restaurantId));
  }

  const { getDefaultRestaurantId } = await import("@/service/restaurantMigration");
  return getDefaultRestaurantId();
}

export function restaurantFilter(
  scope: TenantScope
): { restaurantId: Types.ObjectId } | Record<string, never> {
  if (!scope.restaurantId) {
    return {};
  }
  return { restaurantId: scope.restaurantId };
}

export function assertRestaurantAccess(
  scope: TenantScope,
  resourceRestaurantId?: Types.ObjectId | string | null
): NextResponse | null {
  if (scope.isPlatformOwner) {
    return null;
  }

  if (!scope.restaurantId) {
    return NextResponse.json(
      { success: false, message: "Ресторанд хамаарахгүй хэрэглэгч" },
      { status: 403 }
    );
  }

  if (!resourceRestaurantId) {
    return null;
  }

  const resourceId =
    resourceRestaurantId instanceof Types.ObjectId
      ? resourceRestaurantId
      : new Types.ObjectId(String(resourceRestaurantId));

  if (!resourceId.equals(scope.restaurantId)) {
    return NextResponse.json(
      { success: false, message: "Энэ рестораны өгөгдөлд хандах эрхгүй" },
      { status: 403 }
    );
  }

  return null;
}

async function resolvePlatformOwnerLegacyScope(
  user: IUser
): Promise<Pick<TenantScope, "restaurantId" | "merchantId">> {
  let restaurantId = user.restaurantId
    ? new Types.ObjectId(String(user.restaurantId))
    : null;
  let merchantId: Types.ObjectId | null = null;

  if (!restaurantId) {
    restaurantId = await resolveDefaultLegacyRestaurantId();
  }

  if (restaurantId) {
    merchantId = await resolveMerchantIdForRestaurant(restaurantId);
  }

  return { restaurantId, merchantId };
}

export async function resolvePosMerchantId(
  req: NextRequest
): Promise<Types.ObjectId | null> {
  const queryId = req.nextUrl.searchParams.get("merchantId");
  if (queryId && isValidObjectId(queryId)) {
    return new Types.ObjectId(queryId);
  }

  const authResult = await verifyAuth(req);
  if (authResult && !(authResult instanceof NextResponse)) {
    const id = String(authResult);
    if (isValidObjectId(id)) {
      return new Types.ObjectId(id);
    }
  }

  const user = await getCurrentUser(req);
  if (user) {
    if (isPlatformOwner(user)) {
      const legacy = await resolvePlatformOwnerLegacyScope(user);
      return legacy.merchantId;
    }
    if (user.restaurantId) {
      return resolveMerchantIdForRestaurant(
        new Types.ObjectId(String(user.restaurantId))
      );
    }
  }

  return null;
}

export async function requirePosScope(
  req: NextRequest,
  options: PosScopeOptions = {}
): Promise<TenantScope | NextResponse> {
  const scope = await resolveTenantScope(req);
  if (scope instanceof NextResponse) {
    return NextResponse.json(
      { success: false, message: "Нэвтрэх шаардлагатай" },
      { status: 401 }
    );
  }

  if (options.permission && scope.user) {
    if (!userHasPermission(scope.user, options.permission)) {
      return NextResponse.json(
        { success: false, message: "Энэ үйлдлийг хийх эрхгүй байна" },
        { status: 403 }
      );
    }
  }

  if (!scope.merchantId) {
    let merchantId: Types.ObjectId | null = null;
    if (scope.restaurantId) {
      merchantId = await resolveMerchantIdForRestaurant(scope.restaurantId);
    } else {
      merchantId = await resolvePosMerchantId(req);
    }
    if (merchantId) {
      scope.merchantId = merchantId;
      if (!scope.restaurantId) {
        scope.restaurantId = await resolveRestaurantIdForMerchant(merchantId);
      }
    }
  }

  if (!scope.merchantId) {
    return NextResponse.json(
      { success: false, message: "Нэвтрэх шаардлагатай" },
      { status: 401 }
    );
  }

  if (!scope.restaurantId) {
    scope.restaurantId = await resolveRestaurantIdForMerchant(scope.merchantId);
  }

  return scope;
}

/**
 * /api/auth/session-тай ижил дараалал: merchant token → user_token.
 * resolveTenantScope-ийн өмнө нь user_token-оор user олдсон ч merchantId null
 * болох тохиолдол session амжилттай, menu API 401 болдог байсан.
 */
async function resolveScopeLikeSession(
  req: NextRequest
): Promise<TenantScope | null> {
  const merchantCookie = req.cookies.get(MERCHANT_TOKEN_COOKIE)?.value;
  if (merchantCookie) {
    const merchantId = verifyToken(merchantCookie);
    if (merchantId) {
      const merchant = await Merchants.findById(merchantId).select("_id").lean();
      if (merchant) {
        const merchantObjectId = new Types.ObjectId(String(merchantId));
        const restaurantId = await resolveRestaurantIdForMerchant(merchantObjectId);
        const user = await getCurrentUser(req);
        return {
          user,
          isPlatformOwner: user ? isPlatformOwner(user) : false,
          restaurantId,
          merchantId: merchantObjectId,
        };
      }
    }
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return null;
  }

  const platformOwner = isPlatformOwner(user);
  let restaurantId = user.restaurantId
    ? new Types.ObjectId(String(user.restaurantId))
    : null;
  let merchantId: Types.ObjectId | null = null;

  if (!restaurantId && platformOwner) {
    restaurantId = await resolveDefaultLegacyRestaurantId();
  }

  if (restaurantId) {
    merchantId = await resolveMerchantIdForRestaurant(restaurantId);
  }

  if (!merchantId) {
    return null;
  }

  return {
    user,
    isPlatformOwner: platformOwner,
    restaurantId,
    merchantId,
  };
}

export async function resolveTenantScope(
  req: NextRequest
): Promise<TenantScope | NextResponse> {
  await mongoServer();

  const sessionScope = await resolveScopeLikeSession(req);
  if (sessionScope) {
    return sessionScope;
  }

  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!authResult || !isValidObjectId(String(authResult))) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const merchantId = new Types.ObjectId(String(authResult));
  const restaurantId = await resolveRestaurantIdForMerchant(merchantId);

  return {
    user: null,
    isPlatformOwner: false,
    restaurantId,
    merchantId,
  };
}

export async function resolveTenantScopeFromMerchantId(
  merchantId: Types.ObjectId
): Promise<Pick<TenantScope, "merchantId" | "restaurantId">> {
  const restaurantId = await resolveRestaurantIdForMerchant(merchantId);
  return { merchantId, restaurantId };
}

export async function resolveMerchantTenantScope(req: NextRequest): Promise<{
  merchantId: Types.ObjectId;
  restaurantId: Types.ObjectId | null;
} | null> {
  const scope = await resolveTenantScope(req);
  if (scope instanceof NextResponse) {
    return null;
  }

  if (scope.merchantId && scope.restaurantId) {
    return {
      merchantId: scope.merchantId,
      restaurantId: scope.restaurantId,
    };
  }

  const merchantId = await resolvePosMerchantId(req);
  if (!merchantId) {
    return null;
  }

  const restaurantId =
    scope.restaurantId ?? (await resolveRestaurantIdForMerchant(merchantId));

  return { merchantId, restaurantId };
}

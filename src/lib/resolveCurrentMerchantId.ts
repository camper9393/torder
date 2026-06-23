import mongoServer from "@/config/mongoConfig";
import { Restaurant } from "@/model/restaurant";
import { IUser, UserRole } from "@/model/user";
import {
  resolveDefaultLegacyRestaurantId,
  resolveMerchantIdForRestaurant,
  resolvePosMerchantId,
  resolveRestaurantIdForMerchant,
} from "@/lib/tenant";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

export type MerchantScope = {
  merchantId: Types.ObjectId;
  restaurantId: Types.ObjectId;
};

function getMerchantIdQuery(req: NextRequest): string | null {
  const fromQuery = req.nextUrl.searchParams.get("merchantId");
  if (fromQuery && isValidObjectId(fromQuery)) {
    return fromQuery;
  }
  return null;
}

function getRestaurantIdQuery(req: NextRequest): string | null {
  const fromQuery = req.nextUrl.searchParams.get("restaurantId");
  if (fromQuery && isValidObjectId(fromQuery)) {
    return fromQuery;
  }
  return null;
}

/** Resolve restaurantId for a logged-in user (owner, staff, etc.). */
export async function resolveCurrentRestaurantIdForUser(
  user: IUser
): Promise<Types.ObjectId | null> {
  await mongoServer();

  if (user.restaurantId && isValidObjectId(String(user.restaurantId))) {
    return new Types.ObjectId(String(user.restaurantId));
  }

  const email = user.email?.trim().toLowerCase();
  if (email) {
    const restaurant = await Restaurant.findOne({ email }).select("_id").lean();
    if (restaurant?._id) {
      return new Types.ObjectId(String(restaurant._id));
    }
  }

  return null;
}

/** Resolve merchantId for a logged-in user from their restaurant context. */
export async function resolveCurrentMerchantIdForUser(
  user: IUser
): Promise<Types.ObjectId | null> {
  const restaurantId = await resolveCurrentRestaurantIdForUser(user);
  if (!restaurantId) {
    return null;
  }

  return resolveMerchantIdForRestaurant(restaurantId);
}

async function scopeFromRestaurantAndMerchant(
  restaurantId: Types.ObjectId,
  merchantId: Types.ObjectId | null
): Promise<MerchantScope | null> {
  const resolvedMerchantId =
    merchantId ?? (await resolveMerchantIdForRestaurant(restaurantId));
  if (!resolvedMerchantId) {
    return null;
  }

  return { restaurantId, merchantId: resolvedMerchantId };
}

async function scopeFromMerchantId(
  merchantId: Types.ObjectId
): Promise<MerchantScope | null> {
  const restaurantId = await resolveRestaurantIdForMerchant(merchantId);
  if (!restaurantId) {
    return null;
  }

  return { merchantId, restaurantId };
}

/** Platform owner: selected merchant/restaurant from query or session context. */
async function resolvePlatformOwnerMerchantScope(
  req: NextRequest,
  actor: IUser
): Promise<MerchantScope | null> {
  const queryMerchantId = getMerchantIdQuery(req);
  if (queryMerchantId) {
    return scopeFromMerchantId(new Types.ObjectId(queryMerchantId));
  }

  const queryRestaurantId = getRestaurantIdQuery(req);
  if (queryRestaurantId) {
    const restaurantId = new Types.ObjectId(queryRestaurantId);
    return scopeFromRestaurantAndMerchant(restaurantId, null);
  }

  if (actor.restaurantId && isValidObjectId(String(actor.restaurantId))) {
    const restaurantId = new Types.ObjectId(String(actor.restaurantId));
    return scopeFromRestaurantAndMerchant(restaurantId, null);
  }

  const fromPos = await resolvePosMerchantId(req);
  if (fromPos) {
    return scopeFromMerchantId(fromPos);
  }

  const defaultRestaurantId = await resolveDefaultLegacyRestaurantId();
  if (defaultRestaurantId) {
    return scopeFromRestaurantAndMerchant(defaultRestaurantId, null);
  }

  return null;
}

/** Owner / staff: restaurant and merchant from user session; optional query must match. */
async function resolveStaffMerchantScope(
  req: NextRequest,
  actor: IUser
): Promise<MerchantScope | null> {
  const userRestaurantId = await resolveCurrentRestaurantIdForUser(actor);

  if (userRestaurantId) {
    const userMerchantId = await resolveMerchantIdForRestaurant(userRestaurantId);
    if (!userMerchantId) {
      return null;
    }

    const queryMerchantId = getMerchantIdQuery(req);
    if (queryMerchantId) {
      const queryId = new Types.ObjectId(queryMerchantId);
      if (!queryId.equals(userMerchantId)) {
        return null;
      }
    }

    const queryRestaurantId = getRestaurantIdQuery(req);
    if (queryRestaurantId) {
      const queryRestId = new Types.ObjectId(queryRestaurantId);
      if (!queryRestId.equals(userRestaurantId)) {
        return null;
      }
    }

    return { restaurantId: userRestaurantId, merchantId: userMerchantId };
  }

  const fromPos = await resolvePosMerchantId(req);
  if (fromPos) {
    return scopeFromMerchantId(fromPos);
  }

  return null;
}

/**
 * Resolve merchant + restaurant scope for tablet display settings.
 * Returns null when scope cannot be resolved or caller lacks access.
 */
export async function resolveCurrentMerchantScope(
  req: NextRequest,
  actor: IUser
): Promise<MerchantScope | null> {
  if (actor.role === UserRole.PLATFORM_OWNER) {
    return resolvePlatformOwnerMerchantScope(req, actor);
  }

  return resolveStaffMerchantScope(req, actor);
}

/** Validate URL param merchantId and ensure actor may manage that merchant. */
export async function resolveTabletDisplayScopeFromMerchantParam(
  actor: IUser,
  merchantIdParam: string
): Promise<MerchantScope | null> {
  if (!merchantIdParam?.trim() || !isValidObjectId(merchantIdParam)) {
    return null;
  }

  await mongoServer();
  const merchantId = new Types.ObjectId(merchantIdParam);
  const scope = await scopeFromMerchantId(merchantId);
  if (!scope) {
    return null;
  }

  if (actor.role === UserRole.PLATFORM_OWNER) {
    return scope;
  }

  const userRestaurantId = await resolveCurrentRestaurantIdForUser(actor);
  if (userRestaurantId?.equals(scope.restaurantId)) {
    return scope;
  }

  const userMerchantId = await resolveCurrentMerchantIdForUser(actor);
  if (userMerchantId?.equals(merchantId)) {
    return scope;
  }

  return null;
}

import mongoServer from "@/config/mongoConfig";
import {
  lookupRestaurantIdentity,
  type RestaurantIdentityDebug,
} from "@/lib/resolveRestaurantIdentity";
import { resolveMerchantIdForRestaurant } from "@/lib/tenant";
import { Restaurant } from "@/model/restaurant";
import { IUser, UserRole } from "@/model/user";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

export type TabletDisplayResolveDebug = {
  params: Record<string, string | undefined>;
  bodyKeys: string[];
  userId: string;
  userEmail: string;
  userRole: string;
  userRestaurantId: string | null;
  resolvedMerchantId: string | null;
  resolvedRestaurantId: string | null;
  sources: string[];
  identity: RestaurantIdentityDebug | null;
};

export type TabletDisplayResolveResult =
  | {
      ok: true;
      merchantId: Types.ObjectId;
      restaurantId: Types.ObjectId;
      debug: TabletDisplayResolveDebug;
    }
  | {
      ok: false;
      forbidden?: boolean;
      debug: TabletDisplayResolveDebug;
    };

function pickObjectId(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return isValidObjectId(str) ? str : null;
}

function canAccessResolvedScope(actor: IUser): boolean {
  if (actor.role === UserRole.PLATFORM_OWNER) {
    return true;
  }

  if (actor.role === UserRole.RESTAURANT_OWNER) {
    return true;
  }

  const staffRoles: UserRole[] = [
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.WAITER,
    UserRole.KITCHEN,
  ];

  return staffRoles.includes(actor.role);
}

export async function resolveTabletDisplayContext(
  req: NextRequest,
  actor: IUser,
  params: { merchantId?: string },
  body?: Record<string, unknown> | null
): Promise<TabletDisplayResolveResult> {
  await mongoServer();

  const sources: string[] = [];
  const debug: TabletDisplayResolveDebug = {
    params: {
      merchantId: params.merchantId,
    },
    bodyKeys: body ? Object.keys(body) : [],
    userId: String(actor._id),
    userEmail: actor.email ?? "",
    userRole: actor.role,
    userRestaurantId: actor.restaurantId ? String(actor.restaurantId) : null,
    resolvedMerchantId: null,
    resolvedRestaurantId: null,
    sources,
    identity: null,
  };

  const idCandidates: string[] = [];
  const paramId = pickObjectId(params.merchantId);
  if (paramId) {
    idCandidates.push(paramId);
    sources.push("params.merchantId");
  }

  const queryId = pickObjectId(req.nextUrl.searchParams.get("merchantId"));
  if (queryId) {
    idCandidates.push(queryId);
    sources.push("searchParams.merchantId");
  }

  const bodyMerchantId = pickObjectId(body?.merchantId);
  if (bodyMerchantId) {
    idCandidates.push(bodyMerchantId);
    sources.push("body.merchantId");
  }

  const bodyRestaurantId = pickObjectId(body?.restaurantId);
  if (bodyRestaurantId) {
    idCandidates.push(bodyRestaurantId);
    sources.push("body.restaurantId");
  }

  if (actor.restaurantId && isValidObjectId(String(actor.restaurantId))) {
    idCandidates.push(String(actor.restaurantId));
    sources.push("session.user.restaurantId");
  }

  const primaryId = idCandidates.find(Boolean) ?? null;
  if (!primaryId) {
    return { ok: false, debug };
  }

  const identityLookup = await lookupRestaurantIdentity(primaryId);
  debug.identity = identityLookup.debug;
  debug.resolvedMerchantId = identityLookup.debug.merchantId;
  debug.resolvedRestaurantId = identityLookup.debug.restaurantId;

  if (identityLookup.debug.idRepresents === "merchants._id") {
    sources.push("identity.merchants._id");
  } else if (identityLookup.debug.idRepresents === "restaurants._id") {
    sources.push("identity.restaurants._id");
  }

  if (!identityLookup.restaurantId) {
    if (
      actor.restaurantId &&
      isValidObjectId(String(actor.restaurantId)) &&
      identityLookup.debug.idRepresents === "merchants._id"
    ) {
      const sessionRestaurantId = new Types.ObjectId(String(actor.restaurantId));
      const sessionMerchantId = await resolveMerchantIdForRestaurant(
        sessionRestaurantId
      );
      const paramMerchantId = identityLookup.merchantId;

      if (
        paramMerchantId &&
        sessionMerchantId &&
        paramMerchantId.equals(sessionMerchantId)
      ) {
        sources.push("session.user.restaurantId.merchantMatch");

        return {
          ok: true,
          merchantId: paramMerchantId,
          restaurantId: sessionRestaurantId,
          debug: {
            ...debug,
            resolvedRestaurantId: String(sessionRestaurantId),
            resolvedMerchantId: String(paramMerchantId),
          },
        };
      }

      const email = actor.email?.trim().toLowerCase();
      if (email) {
        const restaurantByEmail = await Restaurant.findOne({ email })
          .select("_id")
          .lean();
        if (restaurantByEmail?._id) {
          const emailRestaurantId = new Types.ObjectId(String(restaurantByEmail._id));
          const emailMerchantId =
            await resolveMerchantIdForRestaurant(emailRestaurantId);
          if (emailMerchantId?.equals(paramMerchantId)) {
            sources.push("session.user.email.restaurantMatch");
            return {
              ok: true,
              merchantId: paramMerchantId,
              restaurantId: emailRestaurantId,
              debug: {
                ...debug,
                resolvedRestaurantId: String(emailRestaurantId),
                resolvedMerchantId: String(paramMerchantId),
              },
            };
          }
        }
      }
    }

    return { ok: false, debug };
  }

  const merchantId =
    identityLookup.merchantId ??
    (identityLookup.debug.merchantId
      ? new Types.ObjectId(identityLookup.debug.merchantId)
      : null);

  if (!merchantId) {
    return { ok: false, debug };
  }

  if (!canAccessResolvedScope(actor)) {
    return { ok: false, forbidden: true, debug };
  }

  return {
    ok: true,
    merchantId,
    restaurantId: identityLookup.restaurantId,
    debug,
  };
}

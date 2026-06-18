import {
  getSettingsRestaurantIdQuery,
  resolveSettingsRestaurantId,
} from "@/lib/settingsAuth";
import {
  resolveDefaultLegacyRestaurantId,
  resolveRestaurantIdForMerchant,
  resolveTenantScope,
} from "@/lib/tenant";
import type { IUser } from "@/model/user";
import { UserRole } from "@/model/user";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

function getMerchantIdQuery(req: NextRequest): string | null {
  const fromQuery = req.nextUrl.searchParams.get("merchantId");
  if (fromQuery && isValidObjectId(fromQuery)) {
    return fromQuery;
  }
  return null;
}

export async function resolveRestaurantContextId(
  req: NextRequest,
  actor: IUser
): Promise<Types.ObjectId | NextResponse> {
  const queryRestaurantId = getSettingsRestaurantIdQuery(req);
  if (queryRestaurantId) {
    const fromQuery = await resolveSettingsRestaurantId(actor, queryRestaurantId);
    if (!(fromQuery instanceof NextResponse)) {
      return fromQuery;
    }
    if (fromQuery.status !== 400) {
      return fromQuery;
    }
  }

  if (actor.restaurantId && isValidObjectId(String(actor.restaurantId))) {
    return new Types.ObjectId(String(actor.restaurantId));
  }

  const merchantIdQuery = getMerchantIdQuery(req);
  if (merchantIdQuery) {
    const fromMerchant = await resolveRestaurantIdForMerchant(
      new Types.ObjectId(merchantIdQuery)
    );
    if (fromMerchant) {
      return fromMerchant;
    }
  }

  const scope = await resolveTenantScope(req);
  if (!(scope instanceof NextResponse) && scope.restaurantId) {
    return scope.restaurantId;
  }

  if (actor.role === UserRole.PLATFORM_OWNER) {
    const defaultId = await resolveDefaultLegacyRestaurantId();
    if (defaultId) {
      return defaultId;
    }
  }

  const fromSession = await resolveSettingsRestaurantId(actor, null);
  if (!(fromSession instanceof NextResponse)) {
    return fromSession;
  }

  return NextResponse.json(
    {
      success: false,
      message:
        "Рестораны мэдээлэл олдсонгүй. restaurantId эсвэл merchantId илгээнэ үү.",
    },
    { status: 400 }
  );
}

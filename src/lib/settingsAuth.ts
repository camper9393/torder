import { getCurrentUser } from "@/lib/auth";
import mongoServer from "@/config/mongoConfig";
import { Permission, userHasPermission, type PermissionKey } from "@/lib/permissions";
import { IUser, UserRole } from "@/model/user";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";

export function canAccessSettings(user: Pick<IUser, "role" | "permissions">) {
  if (user.role === UserRole.PLATFORM_OWNER) return true;
  return userHasPermission(user, Permission.SETTINGS);
}

const RECEIPT_READ_PERMISSIONS: readonly PermissionKey[] = [
  Permission.SETTINGS,
  Permission.PAYMENTS,
  Permission.ORDERS,
  Permission.TABLES,
  Permission.KITCHEN,
];

export function canReadReceiptSettings(user: Pick<IUser, "role" | "permissions">) {
  if (user.role === UserRole.PLATFORM_OWNER) return true;
  return RECEIPT_READ_PERMISSIONS.some((permission) =>
    userHasPermission(user, permission)
  );
}

export async function requireReceiptSettingsReadAccess(
  req: NextRequest
): Promise<IUser | NextResponse> {
  const { requireAuth } = await import("@/lib/auth");
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  if (!canReadReceiptSettings(authResult)) {
    return NextResponse.json(
      { success: false, message: "Баримт хэвлэх тохиргоонд хандах эрхгүй" },
      { status: 403 }
    );
  }

  return authResult;
}

export async function requireSettingsPage(nextPath: string) {
  const { getCurrentPublicUser } = await import("@/lib/auth");
  const user = await getCurrentPublicUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!canAccessSettings(user)) {
    redirect("/login?error=forbidden");
  }
  return user;
}

export async function requireSettingsAccess(
  req: NextRequest
): Promise<IUser | NextResponse> {
  const { requireAuth } = await import("@/lib/auth");
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  if (!canAccessSettings(authResult)) {
    return NextResponse.json(
      { success: false, message: "Тохиргоо хэсэгт хандах эрхгүй" },
      { status: 403 }
    );
  }

  return authResult;
}

export function getSettingsRestaurantIdQuery(req: NextRequest): string | null {
  const fromQuery = req.nextUrl.searchParams.get("restaurantId");
  if (fromQuery && isValidObjectId(fromQuery)) {
    return fromQuery;
  }
  return null;
}

async function restaurantExists(restaurantId: Types.ObjectId): Promise<boolean> {
  await mongoServer();
  const { Restaurant } = await import("@/model/restaurant");
  return Boolean(await Restaurant.exists({ _id: restaurantId }));
}

async function resolveSettingsRestaurantIdInternal(
  actor: IUser,
  queryRestaurantId?: string | null
): Promise<Types.ObjectId | null> {
  const isPlatformOwner = actor.role === UserRole.PLATFORM_OWNER;

  if (!isPlatformOwner) {
    if (!actor.restaurantId) return null;
    return new Types.ObjectId(String(actor.restaurantId));
  }

  if (queryRestaurantId && isValidObjectId(queryRestaurantId)) {
    const selected = new Types.ObjectId(queryRestaurantId);
    if (await restaurantExists(selected)) {
      return selected;
    }
    return null;
  }

  if (actor.restaurantId) {
    return new Types.ObjectId(String(actor.restaurantId));
  }

  return null;
}

export async function resolveSettingsRestaurantIdForPage(
  actor: IUser
): Promise<string | null> {
  if (actor.role === UserRole.PLATFORM_OWNER) {
    if (actor.restaurantId) {
      return String(actor.restaurantId);
    }
    return null;
  }

  const resolved = await resolveSettingsRestaurantIdInternal(actor, null);
  return resolved ? String(resolved) : null;
}

export async function resolveSettingsRestaurantId(
  actor: IUser,
  queryRestaurantId?: string | null
): Promise<Types.ObjectId | NextResponse> {
  const isPlatformOwner = actor.role === UserRole.PLATFORM_OWNER;
  const queryId = queryRestaurantId?.trim() || null;

  if (!isPlatformOwner && queryId) {
    const sessionId = actor.restaurantId ? String(actor.restaurantId) : null;
    if (!sessionId || queryId !== sessionId) {
      return NextResponse.json(
        {
          success: false,
          message: "Энэ рестораны тохиргоонд хандах эрхгүй",
        },
        { status: 403 }
      );
    }
  }

  const resolved = await resolveSettingsRestaurantIdInternal(actor, queryId);

  if (resolved) {
    return resolved;
  }

  if (isPlatformOwner) {
    return NextResponse.json(
      {
        success: false,
        message: "Эхлээд тохиргоо засах ресторанаа сонгоно уу.",
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { success: false, message: "Ресторанд хамаарахгүй хэрэглэгч" },
    { status: 403 }
  );
}

export async function resolveSettingsRestaurantIdFromRequest(
  req: NextRequest,
  actor: IUser
): Promise<Types.ObjectId | NextResponse> {
  const queryId =
    actor.role === UserRole.PLATFORM_OWNER
      ? getSettingsRestaurantIdQuery(req)
      : null;

  return resolveSettingsRestaurantId(actor, queryId);
}

export async function getSettingsLayoutContext(): Promise<{
  isPlatformOwner: boolean;
  sessionRestaurantId: string | null;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { isPlatformOwner: false, sessionRestaurantId: null };
  }

  return {
    isPlatformOwner: user.role === UserRole.PLATFORM_OWNER,
    sessionRestaurantId: user.restaurantId ? String(user.restaurantId) : null,
  };
}

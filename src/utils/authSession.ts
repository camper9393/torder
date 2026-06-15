import { UserRole } from "@/constants/userRoles";
import type { IMerchants } from "@/types/merchant";
import { setMerchant } from "@/store/reducer/merchant";
import { store } from "@/store/store";
import { SESSION } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import { clearAttempts, saveUser } from "@/utils/savedUsers";

const PLATFORM_OWNER_HOME = "/platform/dashboard";

export type AuthLoginUser = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  restaurantId?: string;
  isActive?: boolean;
  passcodeEnabled?: boolean;
};

/** /api/auth/session хариунаас merchant задлах ({ data } эсвэл ирээдүйд { user } гэх мэт) */
export function parseSessionMerchant(res: unknown): IMerchants | null {
  if (!res || typeof res !== "object") return null;
  const body = res as Record<string, unknown>;
  if (body.success !== true) return null;

  const data = body.data;
  if (data && typeof data === "object" && "_id" in data) {
    return data as IMerchants;
  }

  const user = body.user;
  if (user && typeof user === "object" && "_id" in user) {
    return user as IMerchants;
  }

  return null;
}

function persistLoginUser(user: AuthLoginUser | undefined): void {
  if (!user?._id) return;
  saveUser({
    userId: String(user._id),
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role ?? "",
  });
  clearAttempts(String(user._id));
}

/**
 * GET /api/auth/session → Redux merchant (амжилттай бол л set хийнэ).
 * Амжилтгүй бол false — одоогийн Redux state-ийг устгахгүй.
 */
export async function hydrateMerchantSession(): Promise<boolean> {
  try {
    const res = await getApi<unknown>({ url: SESSION });
    const merchant = parseSessionMerchant(res);
    if (!merchant) {
      return false;
    }
    store.dispatch(setMerchant(merchant));
    return true;
  } catch {
    return false;
  }
}

/** Нэвтрэлтийн дараах redirect замыг role-д тохируулна */
export function resolvePostLoginPath(
  user: AuthLoginUser | undefined,
  requestedNext?: string | null
): string {
  const next = requestedNext?.trim() || "/admin/users";

  if (user?.role === UserRole.PLATFORM_OWNER) {
    if (next.startsWith("/platform")) {
      return next;
    }
    return PLATFORM_OWNER_HOME;
  }

  return next;
}

/**
 * Email / PIN нэвтрэлтийн дараах нэгдсэн урсгал:
 * 1. Login хариунаас user-ийг localStorage-д хадгална
 * 2. Session-ийг refresh оролдоно (блоклохгүй)
 * 3. Redirect (бүтэн reload — cookie + ReduxProvider дахин hydrate)
 */
export async function completeLoginAfterSuccess(
  user: AuthLoginUser | undefined,
  nextPath: string
): Promise<void> {
  persistLoginUser(user);
  await hydrateMerchantSession();
  window.location.href = resolvePostLoginPath(user, nextPath);
}

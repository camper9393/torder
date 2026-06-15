"use client";

import { UserRole } from "@/constants/userRoles";
import { useAppSelector } from "@/hook/redux";
import { readPlatformSupportFromDocumentCookie } from "@/lib/platformSupport";
import { useSidebarUser } from "@/hooks/useSidebarUser";

export function usePosRestaurantContext() {
  const merchantId = useAppSelector((state) => state.merchant.merchant?._id);
  const { user, loaded } = useSidebarUser();
  const supportContext = readPlatformSupportFromDocumentCookie();

  const isPlatformOwner = user?.role === UserRole.PLATFORM_OWNER;
  const hasPosRestaurantContext = Boolean(merchantId) || Boolean(supportContext);

  return {
    user,
    loaded,
    isPlatformOwner,
    hasPosRestaurantContext,
    needsPosContextBlock: isPlatformOwner && !hasPosRestaurantContext,
  };
}

"use client";

import { UserRole } from "@/constants/userRoles";
import {
  readPlatformSupportFromDocumentCookie,
  type PlatformSupportPayload,
} from "@/lib/platformSupport";
import { useSidebarUser } from "@/hooks/useSidebarUser";
import React from "react";

export function usePlatformSupportMode() {
  const { user, loaded } = useSidebarUser();
  const [support, setSupport] = React.useState<PlatformSupportPayload | null>(null);

  React.useEffect(() => {
    if (!loaded) {
      return;
    }

    if (user?.role !== UserRole.PLATFORM_OWNER) {
      setSupport(null);
      return;
    }

    setSupport(readPlatformSupportFromDocumentCookie());
  }, [loaded, user?.role]);

  return {
    loaded,
    isPlatformOwner: user?.role === UserRole.PLATFORM_OWNER,
    isSupportMode: Boolean(support),
    support,
  };
}

"use client";

import { UserRole } from "@/constants/userRoles";
import type { SidebarUser } from "@/lib/sidebarPermissions";
import { USER_ME } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import React from "react";

type MeResponse = {
  success: boolean;
  user?: {
    role: UserRole;
    permissions?: string[];
  };
};

export function useSidebarUser(): {
  user: SidebarUser | null;
  loaded: boolean;
} {
  const [user, setUser] = React.useState<SidebarUser | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await getApi<MeResponse>({ url: USER_ME });
        if (cancelled) return;
        if (res?.success && res.user?.role) {
          setUser({
            role: res.user.role,
            permissions: res.user.permissions ?? [],
          });
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loaded };
}

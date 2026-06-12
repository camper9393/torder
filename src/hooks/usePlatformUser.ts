"use client";

import { USER_ME } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
import React from "react";

type MeUser = {
  name?: string;
  email?: string;
  username?: string;
};

export function usePlatformUser() {
  const [user, setUser] = React.useState<MeUser | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await getApi<{ success: boolean; user?: MeUser }>({ url: USER_ME });
      if (!cancelled && res?.success && res.user) {
        setUser(res.user);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}

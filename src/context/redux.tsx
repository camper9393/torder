"use client"

import { store } from "@/store/store";
import { hydrateMerchantSession } from "@/utils/authSession";
import { isConsumerTabletRoute, isKitchenTvRoute } from "@/utils/routes";
import { usePathname } from "next/navigation";
import React from "react"
import { Provider } from "react-redux";

export function ReduxProvider({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
    const pathname = usePathname()

    React.useEffect(() => {
    if (isConsumerTabletRoute(pathname) || isKitchenTvRoute(pathname)) {
      return
    }

    void hydrateMerchantSession()
    }, [pathname])

    return (
        <Provider store={store}>{children}</Provider>
    )
}
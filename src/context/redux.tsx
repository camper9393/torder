"use client"

import { IMerchants } from "@/model/merchants";
import { clearMerchant, setMerchant } from "@/store/reducer/merchant";
import { store } from "@/store/store";
import { ApiResponse } from "@/utils/api";
import { SESSION } from "@/utils/APIConstant";
import { getApi } from "@/utils/common";
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

    const hydrate = async () => {
      try {
        const res = await getApi<ApiResponse<IMerchants>>({
          url: SESSION
        })

        if (!res?.success) {
          store.dispatch(clearMerchant())
          return
        }
        store.dispatch(setMerchant(res?.data as any))
      } catch {
        store.dispatch(clearMerchant())
      }
    }
      hydrate()
    }, [pathname])

    return (
        <Provider store={store}>{children}</Provider>
    )
}
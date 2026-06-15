"use client";

import { Button } from "@/components/ui/button";
import { usePlatformSupportMode } from "@/hooks/usePlatformSupportMode";
import { POST_PLATFORM_RESTAURANT_EXIT_SYSTEM } from "@/utils/APIConstant";
import { postApi } from "@/utils/common";
import { Headphones, LogOut } from "lucide-react";
import React from "react";

export default function PlatformSupportBanner() {
  const { loaded, isSupportMode, support } = usePlatformSupportMode();
  const [exiting, setExiting] = React.useState(false);

  if (!loaded || !isSupportMode || !support) {
    return null;
  }

  const handleExit = async () => {
    setExiting(true);
    try {
      await postApi({ url: POST_PLATFORM_RESTAURANT_EXIT_SYSTEM });
    } catch {
      // API алдаа гарсан ч локал support контекст цэвэрлээд platform руу буцна
    } finally {
      window.location.href = "/platform/restaurants";
    }
  };

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-2 text-amber-950">
        <Headphones className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">
          Support mode:{" "}
          <span className="font-semibold">{support.restaurantName}</span>
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={exiting}
        onClick={() => void handleExit()}
        className="shrink-0 border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
      >
        <LogOut className="mr-1.5 h-4 w-4" />
        {exiting ? "Гарч байна..." : "Ресторанаас гарах"}
      </Button>
    </div>
  );
}

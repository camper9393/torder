"use client";

import { Button } from "@/components/ui/button";
import {
  PlatformCard,
  PlatformEmpty,
  PlatformLoading,
  PlatformPageHeader,
} from "@/components/Platform/shared";
import { GET_PLATFORM_ERRORS, PATCH_PLATFORM_ERROR } from "@/utils/APIConstant";
import { getApi, patchApi } from "@/utils/common";
import React from "react";

type Err = {
  _id: string;
  level: string;
  source: string;
  message: string;
  restaurantName?: string;
  resolved: boolean;
  createdAt: string;
};

export default function PlatformErrorsPage() {
  const [items, setItems] = React.useState<Err[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getApi<{ success: boolean; data?: Err[] }>({
      url: GET_PLATFORM_ERRORS,
      param: { resolved: "false" },
    });
    if (res?.success && res.data) setItems(res.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id: string) => {
    await patchApi({ url: PATCH_PLATFORM_ERROR(id), values: {} });
    await load();
  };

  return (
    <div className="space-y-6">
      <PlatformPageHeader title="Системийн алдаа" />
      {loading ? <PlatformLoading /> : null}
      {!loading && items.length === 0 ? <PlatformEmpty /> : null}
      {!loading && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((e) => (
            <PlatformCard key={e._id}>
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-red-600">{e.level}</p>
                  <h3 className="font-semibold">{e.source}</h3>
                  <p className="mt-1 text-sm text-slate-600">{e.message}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {e.restaurantName ?? "Platform"} ·{" "}
                    {new Date(e.createdAt).toLocaleString("mn-MN")}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void resolve(e._id)}>
                  Шийдсэн
                </Button>
              </div>
            </PlatformCard>
          ))}
        </div>
      ) : null}
    </div>
  );
}

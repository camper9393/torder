"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import {
  PlatformCard,
  PlatformEmpty,
  PlatformLoading,
  PlatformPageHeader,
  PlatformTable,
  PlatformTableHead,
} from "@/components/Platform/shared";
import SupportTicketConversation from "@/components/Support/SupportTicketConversation";
import {
  GET_PLATFORM_SUPPORT,
  GET_PLATFORM_SUPPORT_DETAIL,
  PATCH_PLATFORM_SUPPORT,
  POST_PLATFORM_SUPPORT_MESSAGE,
} from "@/utils/APIConstant";
import { getApi, patchApi } from "@/utils/common";
import {
  labelSupportPriority,
  labelSupportStatus,
  labelSupportType,
} from "@/utils/supportLabels";
import { SupportStatus } from "@/constants/support";
import { cn } from "@/lib/utils";
import {
  useMarkNotificationsReadOnPage,
  useMarkSupportTicketNotificationsRead,
} from "@/hooks/useNotificationCounts";

type TicketRow = {
  _id: string;
  restaurantName?: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
};

const STATUS_OPTIONS: { value: SupportStatus; label: string }[] = [
  { value: SupportStatus.NEW, label: "Шинэ" },
  { value: SupportStatus.IN_PROGRESS, label: "Шалгаж байна" },
  { value: SupportStatus.RESOLVED, label: "Шийдэгдсэн" },
  { value: SupportStatus.CLOSED, label: "Хаагдсан" },
];

export default function PlatformSupportPage() {
  const searchParams = useSearchParams();
  const ticketFromUrl = searchParams.get("ticket");

  useMarkNotificationsReadOnPage("support");

  const [items, setItems] = React.useState<TicketRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(ticketFromUrl);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getApi<{ success: boolean; data?: TicketRow[] }>({
      url: GET_PLATFORM_SUPPORT,
    });
    if (res?.success && res.data) setItems(res.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (ticketFromUrl) setSelectedId(ticketFromUrl);
  }, [ticketFromUrl]);

  const updateStatus = async (id: string, status: string) => {
    const res = await patchApi<{ success: boolean; message?: string }>({
      url: PATCH_PLATFORM_SUPPORT(id),
      values: { status },
    });
    if (!res?.success) {
      toast.error(res?.message || "Статус шинэчлэхэд алдаа");
      return;
    }
    await load();
  };

  const selected = items.find((t) => t._id === selectedId);

  useMarkSupportTicketNotificationsRead(
    selectedId,
    selected?.status
  );

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Support төв"
        description="Ресторануудын тусламжийн хүсэлт, харилцаа"
      />

      {loading ? <PlatformLoading /> : null}

      {!loading && items.length === 0 ? <PlatformEmpty /> : null}

      {!loading && items.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <PlatformCard className="p-0 overflow-hidden">
            <PlatformTable>
              <PlatformTableHead>
                <tr>
                  <th className="px-4 py-3">Ресторан</th>
                  <th className="px-4 py-3">Гарчиг</th>
                  <th className="hidden px-4 py-3 md:table-cell">Ангилал</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Чухал</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Огноо</th>
                </tr>
              </PlatformTableHead>
              <tbody className="divide-y divide-slate-100">
                {items.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => setSelectedId(t._id)}
                    className={cn(
                      "cursor-pointer transition hover:bg-slate-50 touch-manipulation",
                      selectedId === t._id && "bg-blue-50/70"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {t.restaurantName ?? "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-700">
                      {t.title}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                      {labelSupportType(t.type)}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {labelSupportPriority(t.priority)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          t.status === "new" && "bg-blue-100 text-blue-800",
                          t.status === "inProgress" && "bg-amber-100 text-amber-800",
                          t.status === "resolved" && "bg-emerald-100 text-emerald-800",
                          t.status === "closed" && "bg-slate-100 text-slate-600"
                        )}
                      >
                        {labelSupportStatus(t.status)}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-500 lg:table-cell">
                      {new Date(t.createdAt).toLocaleString("mn-MN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </PlatformTable>
          </PlatformCard>

          <div className="min-h-[520px]">
            {selectedId && selected ? (
              <PlatformCard className="h-full">
                <div className="mb-3 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => void updateStatus(selectedId, opt.value)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition touch-manipulation",
                        selected.status === opt.value
                          ? "border-[#1E5EFF] bg-[#1E5EFF] text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <SupportTicketConversation
                  ticketId={selectedId}
                  detailUrl={GET_PLATFORM_SUPPORT_DETAIL(selectedId)}
                  messageUrl={POST_PLATFORM_SUPPORT_MESSAGE(selectedId)}
                  isStaff
                  onStatusChange={(status) => void updateStatus(selectedId, status)}
                />
              </PlatformCard>
            ) : (
              <PlatformCard className="flex h-full min-h-[320px] items-center justify-center text-sm text-slate-500">
                Хүсэлт сонгоно уу
              </PlatformCard>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

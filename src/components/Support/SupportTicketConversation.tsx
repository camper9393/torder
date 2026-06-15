"use client";

import React from "react";
import Image from "next/image";
import { Send } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { getApi, postApi } from "@/utils/common";
import { cn } from "@/lib/utils";
import {
  labelSupportPriority,
  labelSupportStatus,
  labelSupportType,
} from "@/utils/supportLabels";
import { SupportStatus } from "@/constants/support";

export type SupportMessage = {
  _id: string;
  body: string;
  imageUrls: string[];
  authorName?: string;
  isStaffReply: boolean;
  createdAt: string;
};

export type SupportTicketDetail = {
  ticket: {
    _id: string;
    title: string;
    status: string;
    priority: string;
    type: string;
    restaurantName?: string;
    imageUrls?: string[];
  };
  restaurant?: { name: string; email?: string; phone?: string } | null;
  createdByUser?: { name: string; email?: string } | null;
  messages: SupportMessage[];
};

type SupportTicketConversationProps = {
  ticketId: string;
  detailUrl: string;
  messageUrl: string;
  isStaff?: boolean;
  onStatusChange?: (status: string) => void;
};

export default function SupportTicketConversation({
  ticketId,
  detailUrl,
  messageUrl,
  isStaff = false,
  onStatusChange,
}: SupportTicketConversationProps) {
  const [detail, setDetail] = React.useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    const res = await getApi<{ success: boolean; data?: SupportTicketDetail }>({
      url: detailUrl,
    });
    if (res?.success && res.data) setDetail(res.data);
    setLoading(false);
  }, [detailUrl]);

  React.useEffect(() => {
    void load();
  }, [load, ticketId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages.length]);

  const sendMessage = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await postApi<{ success: boolean; message?: string }>({
        url: messageUrl,
        values: { body: text },
      });
      if (!res?.success) {
        toast.error(res?.message || "Илгээхэд алдаа гарлаа");
        return;
      }
      setBody("");
      await load();
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Ачааллаж байна...</p>;
  }

  if (!detail) {
    return <p className="text-sm text-red-600">Хүсэлт олдсонгүй</p>;
  }

  const { ticket, messages, restaurant, createdByUser } = detail;

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-lg font-bold text-slate-900">{ticket.title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {ticket.restaurantName ?? restaurant?.name} ·{" "}
          {labelSupportType(ticket.type)} · {labelSupportPriority(ticket.priority)} ·{" "}
          <span className="font-medium">{labelSupportStatus(ticket.status)}</span>
        </p>
        {createdByUser ? (
          <p className="mt-1 text-xs text-slate-500">
            Илгээсэн: {createdByUser.name}
            {createdByUser.email ? ` (${createdByUser.email})` : ""}
          </p>
        ) : null}
        {isStaff && onStatusChange ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                SupportStatus.NEW,
                SupportStatus.IN_PROGRESS,
                SupportStatus.RESOLVED,
                SupportStatus.CLOSED,
              ] as const
            ).map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={ticket.status === status ? "default" : "outline"}
                onClick={() => onStatusChange(status)}
              >
                {labelSupportStatus(status)}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
              msg.isStaffReply
                ? "ml-auto bg-[#1E5EFF] text-white"
                : "mr-auto bg-slate-100 text-slate-900"
            )}
          >
            <p className="mb-1 text-[10px] font-medium opacity-80">
              {msg.isStaffReply ? "Support" : msg.authorName ?? "Та"}
            </p>
            <p className="whitespace-pre-wrap">{msg.body}</p>
            {msg.imageUrls.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {msg.imageUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg"
                  >
                    <Image
                      src={url}
                      alt=""
                      width={120}
                      height={120}
                      className="h-24 w-24 object-cover"
                      unoptimized
                    />
                  </a>
                ))}
              </div>
            ) : null}
            <p className="mt-1 text-[10px] opacity-70">
              {new Date(msg.createdAt).toLocaleString("mn-MN")}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Мессеж бичнэ үү..."
          rows={2}
          className="min-h-[3rem] flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/20"
        />
        <Button
          type="button"
          className="h-auto shrink-0 bg-[#1E5EFF] px-4 hover:bg-[#1548D4]"
          disabled={sending || !body.trim()}
          onClick={() => void sendMessage()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

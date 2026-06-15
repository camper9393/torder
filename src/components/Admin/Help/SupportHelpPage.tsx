"use client";

import React from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GET_SUPPORT,
  GET_SUPPORT_DETAIL,
  POST_SUPPORT,
  POST_SUPPORT_MESSAGE,
  POST_SUPPORT_UPLOAD,
} from "@/utils/APIConstant";
import { getApi, postApi } from "@/utils/common";
import SupportTicketConversation from "@/components/Support/SupportTicketConversation";
import {
  SUPPORT_CATEGORY_OPTIONS,
  SUPPORT_PRIORITY_OPTIONS,
  labelSupportPriority,
  labelSupportStatus,
  labelSupportType,
} from "@/utils/supportLabels";
import { SupportPriority, SupportType } from "@/constants/support";
import { cn } from "@/lib/utils";

type TicketRow = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  createdAt: string;
};

const TITLE_SUGGESTIONS = [
  "Цэс ажиллахгүй байна",
  "Принтер холбогдохгүй байна",
  "Захиалга ирэхгүй байна",
];

export default function SupportHelpPage() {
  const searchParams = useSearchParams();
  const ticketFromUrl = searchParams.get("ticket");

  const [tickets, setTickets] = React.useState<TicketRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(ticketFromUrl);

  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [type, setType] = React.useState<SupportType>(SupportType.TECHNICAL);
  const [priority, setPriority] = React.useState<SupportPriority>(
    SupportPriority.MEDIUM
  );
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);

  const loadTickets = React.useCallback(async () => {
    setLoading(true);
    const res = await getApi<{ success: boolean; data?: TicketRow[] }>({
      url: GET_SUPPORT,
    });
    if (res?.success && res.data) setTickets(res.data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  React.useEffect(() => {
    if (ticketFromUrl) setSelectedId(ticketFromUrl);
  }, [ticketFromUrl]);

  const clearForm = () => {
    setTitle("");
    setMessage("");
    setType(SupportType.TECHNICAL);
    setPriority(SupportPriority.MEDIUM);
    setImageUrls([]);
  };

  const resetForm = () => {
    clearForm();
    setSuccess(false);
  };

  const onPickImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (imageUrls.length + files.length > 5) {
      toast.error("Хамгийн ихдээ 5 зураг");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("images", f));
      const res = await fetch("/api/support/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { urls: string[] };
        message?: string;
      };
      if (!json.success || !json.data?.urls) {
        toast.error(json.message || "Зураг хадгалахад алдаа");
        return;
      }
      setImageUrls((prev) => [...prev, ...json.data!.urls].slice(0, 5));
    } catch {
      toast.error("Зураг хадгалахад алдаа");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Гарчиг болон тайлбар оруулна уу");
      return;
    }
    setSubmitting(true);
    setSuccess(false);
    try {
      const res = await postApi<{ success: boolean; message?: string; data?: TicketRow }>({
        url: POST_SUPPORT,
        values: { title, message, type, priority, imageUrls },
      });
      if (!res?.success) {
        toast.error(res?.message || "Илгээхэд алдаа гарлаа");
        return;
      }
      setSuccess(true);
      clearForm();
      await loadTickets();
      if (res.data?._id) setSelectedId(res.data._id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Тусламж & Support</h1>
        <p className="mt-1 text-sm text-slate-600">
          Асуудлаа илгээх эсвэл өмнөх хүсэлтийнхөө хариуг харах
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form
          onSubmit={(e) => void submit(e)}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold text-slate-900">Шинэ хүсэлт илгээх</h2>

          {success ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Хүсэлт амжилттай илгээгдлээ. Support баг удахгүй хариулна.
            </p>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Гарчиг</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Асуудлын товч нэр"
              required
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TITLE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-[#1E5EFF]/40"
                  onClick={() => setTitle(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Тайлбар</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#1E5EFF] focus:ring-2 focus:ring-[#1E5EFF]/20"
              placeholder="Асуудлыг дэлгэрэнгүй тайлбарлана уу..."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Ангилал</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SupportType)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                {SUPPORT_CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Чухал зэрэг</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SupportPriority)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                {SUPPORT_PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Screenshot (JPG, PNG, WEBP — хамгийн ихдээ 5)
            </label>
            <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500 hover:bg-slate-100">
              <ImagePlus className="mb-2 h-6 w-6" />
              {uploading ? "Хадгалж байна..." : "Зураг сонгох"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                disabled={uploading || imageUrls.length >= 5}
                onChange={(e) => void onPickImages(e)}
              />
            </label>
            {imageUrls.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url) => (
                  <div key={url} className="relative">
                    <Image
                      src={url}
                      alt=""
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] rounded-lg object-cover"
                      unoptimized
                    />
                    <button
                      type="button"
                      className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                      onClick={() =>
                        setImageUrls((prev) => prev.filter((u) => u !== url))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="submit"
              disabled={submitting}
              className="min-h-11 bg-[#1E5EFF] px-6 hover:bg-[#1548D4] touch-manipulation"
            >
              {submitting ? "Илгээж байна..." : "Илгээх"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 touch-manipulation"
              onClick={resetForm}
            >
              Цэвэрлэх
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Миний хүсэлтүүд</h2>
            {loading ? (
              <p className="text-sm text-slate-500">Ачааллаж байна...</p>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-slate-500">Одоогоор хүсэлт байхгүй</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {tickets.map((t) => (
                  <li key={t._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t._id)}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left text-sm transition touch-manipulation",
                        selectedId === t._id
                          ? "border-[#1E5EFF] bg-[#1E5EFF]/5"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <p className="font-medium text-slate-900">{t.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {labelSupportStatus(t.status)} ·{" "}
                        {new Date(t.createdAt).toLocaleDateString("mn-MN")}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedId ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:min-h-[480px]">
              <SupportTicketConversation
                ticketId={selectedId}
                detailUrl={GET_SUPPORT_DETAIL(selectedId)}
                messageUrl={POST_SUPPORT_MESSAGE(selectedId)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

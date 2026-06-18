"use client";

import React from "react";
import { Database, Download, Loader2 } from "lucide-react";

import SettingsSectionCard from "@/components/Admin/Settings/SettingsSectionCard";
import { GET_DATABASE_BACKUP } from "@/utils/APIConstant";
import { cn } from "@/lib/utils";

function parseBackupFilename(disposition: string | null): string {
  if (!disposition) {
    return `torder-backup-${Date.now()}.json`;
  }
  const match = /filename="([^"]+)"/i.exec(disposition);
  return match?.[1] ?? `torder-backup-${Date.now()}.json`;
}

export default function BackupPanel() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleDownloadBackup = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api${GET_DATABASE_BACKUP}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        let message = "Backup хийхэд алдаа гарлаа";
        try {
          const body = (await response.json()) as { message?: string };
          if (body?.message) message = body.message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const blob = await response.blob();
      const filename = parseBackupFilename(
        response.headers.get("Content-Disposition")
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Backup хийхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSectionCard
      title="Өгөгдлийн нөөцлөлт"
      description="MongoDB дахь рестораны чухал өгөгдлийг JSON файл болгон татна."
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <Database className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <ul className="list-inside list-disc text-xs text-slate-500">
            <li>Цэсний бараа, ангилал, ширээ, захиалга</li>
            <li>QR болон цэсний тохиргоо</li>
            <li>Админ хэрэглэгч (нууц үггүй)</li>
          </ul>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void handleDownloadBackup()}
              disabled={loading}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Backup татах
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </SettingsSectionCard>
  );
}

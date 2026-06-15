"use client"

import React from "react"
import { Database, Download, Loader2 } from "lucide-react"
import { GET_DATABASE_BACKUP } from "@/utils/APIConstant"
import { cn } from "@/lib/utils"
import PasscodeManager from "@/components/Auth/PasscodeManager"

function parseBackupFilename(disposition: string | null): string {
  if (!disposition) {
    return `torder-backup-${Date.now()}.json`
  }
  const match = /filename="([^"]+)"/i.exec(disposition)
  return match?.[1] ?? `torder-backup-${Date.now()}.json`
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleDownloadBackup = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api${GET_DATABASE_BACKUP}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        let message = "Backup хийхэд алдаа гарлаа"
        try {
          const body = (await response.json()) as { message?: string }
          if (body?.message) message = body.message
        } catch {
          // JSON биш хариу — default мессеж үлдэнэ
        }
        setError(message)
        return
      }

      const blob = await response.blob()
      const filename = parseBackupFilename(
        response.headers.get("Content-Disposition")
      )
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError("Backup хийхэд алдаа гарлаа")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Тохиргоо</h1>
        <p className="mt-1 text-sm text-gray-600">
          Системийн тохиргоо болон өгөгдлийн нөөцлөлт
        </p>
      </div>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
            <Database className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-900">Өгөгдлийн нөөцлөлт</h2>
            <p className="mt-1 text-sm text-gray-600">
              MongoDB дахь рестораны чухал өгөгдлийг (цэс, ангилал, ширээ,
              захиалга, тохиргоо, хэрэглэгч) JSON файл болгон татна.
            </p>
            <ul className="mt-3 list-inside list-disc text-xs text-gray-500">
              <li>Цэсний бараа</li>
              <li>Ангилал, дараалал</li>
              <li>Ширээ, танхим</li>
              <li>Захиалга</li>
              <li>QR болон цэсний тохиргоо</li>
              <li>Админ хэрэглэгч (нууц үггүй)</li>
            </ul>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={loading}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      </section>

      <div className="mt-6">
        <PasscodeManager />
      </div>
    </div>
  )
}

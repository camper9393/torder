"use client"

import GenerateQR from "@/components/QR/GenerateQR"
import { Button } from "@/components/ui/button"
import { downloadQrPng } from "@/utils/qrCanvas"
import { Copy, Download } from "lucide-react"
import toast from "react-hot-toast"

type TabletOrderTableCardProps = {
  tableName: string
  menuLink: string
  domId: string
}

export default function TabletOrderTableCard({
  tableName,
  menuLink,
  domId,
}: TabletOrderTableCardProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuLink)
      toast.success("Таблет холбоос хуулагдлаа")
    } catch {
      toast.error("Холбоос хуулахад алдаа гарлаа")
    }
  }

  const handleDownload = () => {
    if (!downloadQrPng(domId, tableName)) {
      toast.error("QR татахад алдаа гарлаа")
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border bg-white p-5 shadow-sm">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
        Ширээ
      </p>
      <h3 className="mb-4 truncate text-xl font-bold text-gray-900">
        {tableName}
      </h3>

      <div className="mb-4 flex justify-center rounded-xl bg-gray-50 py-4">
        <GenerateQR
          id={domId}
          value={menuLink}
          maxSize={200}
          scanLabel="Таблет захиалга"
          showUrl={false}
        />
      </div>

      <div className="mb-4 min-w-0">
        <p className="mb-1 text-xs font-medium text-gray-500">
          Таблет захиалгын холбоос
        </p>
        <a
          href={menuLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block break-all text-sm font-medium text-[#1E5EFF] hover:underline"
        >
          {menuLink}
        </a>
      </div>

      <div className="mt-auto flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11 min-w-0 flex-1"
          onClick={handleDownload}
        >
          <Download className="mr-1 h-4 w-4" aria-hidden />
          Download QR
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11 min-w-0 flex-1"
          onClick={() => void handleCopy()}
        >
          <Copy className="mr-1 h-4 w-4" aria-hidden />
          Copy tablet link
        </Button>
      </div>
    </article>
  )
}

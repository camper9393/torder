"use client"

import GenerateQR from "@/components/QR/GenerateQR"
import { Button } from "@/components/ui/button"
import { downloadQrPng, printQrCard } from "@/utils/qrCanvas"
import { Messages } from "@/utils/i18n/types"
import { Copy, Download, Printer, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

export type QrRecord = {
  _id: string
  name: string
  merchantId: string
  createdAt?: string
}

type QrManagerCardProps = {
  qr: QrRecord
  menuLink: string
  domId: string
  labels: Messages["qrManager"]
  onDelete: (id: string) => void
  deleting: boolean
}

function QrManagerCard({
  qr,
  menuLink,
  domId,
  labels,
  onDelete,
  deleting,
}: QrManagerCardProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(menuLink)
      toast.success(labels.copied)
    } catch {
      toast.error(labels.copyLink)
    }
  }

  const handleDownload = () => {
    if (!downloadQrPng(domId, qr.name)) {
      toast.error(labels.download)
    }
  }

  const handlePrint = () => {
    if (!printQrCard(domId, qr.name, menuLink)) {
      toast.error(labels.print)
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {labels.tableName}
          </p>
          <h3 className="truncate text-xl font-bold text-gray-900">{qr.name}</h3>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={deleting}
          onClick={() => onDelete(qr._id)}
          className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
          aria-label={labels.delete}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="mb-4 flex justify-center rounded-xl bg-gray-50 py-4">
        <GenerateQR
          id={domId}
          value={menuLink}
          maxSize={200}
          scanLabel={labels.scanHint}
          showUrl={false}
        />
      </div>

      <div className="mb-4 min-w-0">
        <p className="mb-1 text-xs font-medium text-gray-500">{labels.menuLink}</p>
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
          className="flex-1 min-w-[5.5rem]"
          onClick={handlePrint}
        >
          <Printer className="mr-1 h-4 w-4" aria-hidden />
          {labels.print}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1 min-w-[5.5rem]"
          onClick={handleDownload}
        >
          <Download className="mr-1 h-4 w-4" aria-hidden />
          {labels.download}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1 min-w-[5.5rem]"
          onClick={handleCopy}
        >
          <Copy className="mr-1 h-4 w-4" aria-hidden />
          {labels.copyLink}
        </Button>
      </div>
    </article>
  )
}

export default QrManagerCard

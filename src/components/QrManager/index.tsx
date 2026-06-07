"use client"

import React from "react"
import { useAppSelector } from "@/hook/redux"
import { useLocale } from "@/context/LocaleContext"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"
import SidebarMenuToggle from "@/components/layout/SidebarMenuToggle"
import QrManagerCard, { QrRecord } from "./QrManagerCard"
import { GET_QR, REMOVE_QR } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { deleteApi, getApi } from "@/utils/common"
import { buildConsumerMenuUrl } from "@/utils/table"
import { QrCode } from "lucide-react"
import toast from "react-hot-toast"

function QrManagerPage() {
  const merchantId = useAppSelector((state) => state.merchant).merchant?._id
  const { t } = useLocale()
  const q = t.qrManager

  const [qrs, setQrs] = React.useState<QrRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const fetchQrs = React.useCallback(async (options?: { silent?: boolean }) => {
    if (!merchantId) {
      setLoading(false)
      return
    }

    if (!options?.silent) {
      setLoading(true)
    }

    try {
      const res = await getApi<ApiResponse<QrRecord[]>>({ url: GET_QR })
      if (res?.success && res.data) {
        setQrs(
          res.data.map((item) => ({
            ...item,
            _id: String(item._id),
            merchantId: String(item.merchantId),
          }))
        )
      }
    } catch {
      toast.error(q.loadFailed)
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [merchantId, q.loadFailed])

  React.useEffect(() => {
    setLoading(true)
    fetchQrs()
  }, [fetchQrs])

  React.useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        void fetchQrs({ silent: true })
      }
    }

    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [fetchQrs])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await deleteApi<ApiResponse<unknown>>({
        url: REMOVE_QR,
        param: { id },
      })

      if (!res?.success) {
        throw new Error(res?.message || q.deleteFailed)
      }

      setQrs((prev) => prev.filter((item) => item._id !== id))
      toast.success(q.deleted)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : q.deleteFailed
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  if (!merchantId) {
    return (
      <div className="min-h-screen bg-[#F8F5F0]">
        <div className="mx-auto max-w-lg rounded-2xl border bg-white p-10 text-center shadow-sm">
          <QrCode className="mx-auto mb-4 h-12 w-12 text-gray-400" aria-hidden />
          <p className="text-lg text-gray-600">{q.signInRequired}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <SidebarMenuToggle />
            <QrCode className="h-8 w-8 text-green-600" aria-hidden />
            <div>
              <h1 className="font-serif text-3xl font-bold text-slate-950">
                {q.title}
              </h1>
              <p className="text-sm text-gray-600">{q.subtitle}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {loading && (
          <p className="text-center text-gray-500">{q.loading}</p>
        )}

        {!loading && qrs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
            {q.empty}
          </div>
        )}

        {!loading && qrs.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {qrs.map((qr) => {
              const link = buildConsumerMenuUrl(qr.merchantId, qr.name)
              const domId = `qr-mgr-${qr._id}`
              return (
                <QrManagerCard
                  key={qr._id}
                  qr={qr}
                  menuLink={link}
                  domId={domId}
                  labels={q}
                  onDelete={handleDelete}
                  deleting={deletingId === qr._id}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default QrManagerPage

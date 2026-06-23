"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area, type Point } from "react-easy-crop"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getCroppedImageFile, revokeBlobUrl } from "@/utils/cropImage"

type MenuImageCropModalProps = {
  open: boolean
  imageSrc: string | null
  fileName: string
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File, previewUrl: string) => void
}

export function MenuImageCropModal({
  open,
  imageSrc,
  fileName,
  onOpenChange,
  onConfirm,
}: MenuImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const resetState = useCallback(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setSaving(false)
  }, [])

  const handleCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleCancel = () => {
    onOpenChange(false)
    resetState()
  }

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      toast.error("Crop хийх бүс сонгоно уу")
      return
    }

    try {
      setSaving(true)
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName)
      const previewUrl = URL.createObjectURL(file)
      onConfirm(file, previewUrl)
      onOpenChange(false)
      resetState()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Зураг crop хийхэд алдаа гарлаа"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && imageSrc) {
      revokeBlobUrl(imageSrc)
    }
    onOpenChange(nextOpen)
    if (!nextOpen) resetState()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg" centered>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Зураг crop хийх</DialogTitle>
          <DialogDescription>
            Зургаа чирж байрлуулаад дөрвөлжин хэлбэрээр crop хийнэ.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <div className="relative h-[min(52vh,360px)] w-full overflow-hidden rounded-xl bg-neutral-900">
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-muted-foreground">Томруулах</span>
              <span className="tabular-nums text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-primary"
              aria-label="Томруулах"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 px-6 pb-6 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
            Болих
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={saving}>
            {saving ? "Бэлтгэж байна…" : "Crop хадгалах"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

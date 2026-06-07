"use client"

import React from "react"
import type { FloorLayoutTable, FloorLayoutPayload } from "@/types/floorLayout"
import { useLocale } from "@/context/LocaleContext"
import { FloorLayoutEditorPanel } from "./FloorLayoutEditorPanel"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type FloorLayoutModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (payload: FloorLayoutPayload) => void
}

export function FloorLayoutModal({
  open,
  onOpenChange,
  onSaved,
}: FloorLayoutModalProps) {
  const { t } = useLocale()
  const fl = t.floorLayout
  const [dirty, setDirty] = React.useState(false)

  const requestClose = React.useCallback(() => {
    if (dirty) {
      const discard = window.confirm(fl.discardUnsaved)
      if (!discard) return
    }
    onOpenChange(false)
  }, [dirty, fl.discardUnsaved, onOpenChange])

  const handleOpenChange = (next: boolean) => {
    if (next) {
      onOpenChange(true)
      return
    }
    requestClose()
  }

  const handleSaved = (payload: FloorLayoutPayload) => {
    onSaved(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed top-[5vh] left-[2.5vw] z-50 flex h-[90vh] w-[95vw] max-w-[95vw] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-xl border p-0 shadow-2xl sm:max-w-[95vw]"
      >
        <FloorLayoutEditorPanel
          active={open}
          variant="modal"
          onSaved={handleSaved}
          onDirtyChange={setDirty}
          onRequestClose={requestClose}
        />
      </DialogContent>
    </Dialog>
  )
}

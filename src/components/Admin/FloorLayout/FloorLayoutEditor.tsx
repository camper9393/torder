"use client"

import { FloorLayoutEditorPanel } from "./FloorLayoutEditorPanel"

/** Standalone page shell (route redirects to tables; kept for reuse). */
export default function FloorLayoutEditor() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <FloorLayoutEditorPanel active variant="page" />
    </div>
  )
}

"use client"

import React from "react"
import { Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

function FullscreenButton({ className }: { className?: string }) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  React.useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener("fullscreenchange", syncFullscreen)
    document.addEventListener("webkitfullscreenchange", syncFullscreen)

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen)
      document.removeEventListener("webkitfullscreenchange", syncFullscreen)
    }
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else {
          await (
            document as Document & { webkitExitFullscreen?: () => Promise<void> }
          ).webkitExitFullscreen?.()
        }
        return
      }

      const root = document.documentElement
      const request =
        root.requestFullscreen?.bind(root) ??
        (
          root as HTMLElement & {
            webkitRequestFullscreen?: () => Promise<void>
          }
        ).webkitRequestFullscreen?.bind(root)

      if (request) {
        await request()
      }
    } catch {
      // User cancelled or browser blocked fullscreen
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      aria-pressed={isFullscreen}
      className={cn(
        "fixed top-4 right-4 z-40 flex min-h-11 items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-sm font-medium text-gray-900 shadow-lg ring-1 ring-black/5 backdrop-blur-md transition hover:bg-white active:scale-[0.98] touch-manipulation",
        className
      )}
    >
      {isFullscreen ? (
        <Minimize2 className="h-4 w-4 shrink-0 text-[#1E5EFF]" aria-hidden />
      ) : (
        <Maximize2 className="h-4 w-4 shrink-0 text-[#1E5EFF]" aria-hidden />
      )}
      <span>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</span>
    </button>
  )
}

export default FullscreenButton

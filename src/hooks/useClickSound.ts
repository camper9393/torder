"use client"

import { useEffect } from "react"
import {
  clickSoundEnabled,
  isClickSoundTarget,
  playClickSound,
} from "@/utils/clickSound"

/**
 * Global pointer listener — plays a short click on interactive elements.
 * Does not attach per-button handlers.
 */
export function useClickSound(): void {
  useEffect(() => {
    if (!clickSoundEnabled) return

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      if (!isClickSoundTarget(event.target)) return
      playClickSound()
    }

    document.addEventListener("pointerdown", onPointerDown, { capture: true })
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true })
    }
  }, [])
}

"use client"

import { useClickSound } from "@/hooks/useClickSound"

/** Mounts the global click-sound listener once for the whole app. */
export default function ClickSoundProvider() {
  useClickSound()
  return null
}

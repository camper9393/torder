"use client"

import React from "react"
import { getKitchenDingSrc } from "@/utils/kitchenDing"

export function useKitchenDing() {
  const [soundEnabled, setSoundEnabled] = React.useState(false)
  const soundEnabledRef = React.useRef(false)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  const getAudio = React.useCallback(() => {
    if (!audioRef.current) {
      const src = getKitchenDingSrc()
      if (!src) return null
      audioRef.current = new Audio(src)
      audioRef.current.volume = 0.6
    }
    return audioRef.current
  }, [])

  const playDing = React.useCallback(() => {
    if (!soundEnabledRef.current) return
    const audio = getAudio()
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => {})
  }, [getAudio])

  const enableSound = React.useCallback(async () => {
    const audio = getAudio()
    if (!audio) return false
    try {
      audio.currentTime = 0
      await audio.play()
      setSoundEnabled(true)
      soundEnabledRef.current = true
      return true
    } catch {
      return false
    }
  }, [getAudio])

  return { soundEnabled, playDing, enableSound }
}

export function useNotifyNewKitchenItems<
  T extends { _id: string; status: string },
>(items: T[], statusFilter: string, playDing: () => void) {
  const notifiedIdsRef = React.useRef<Set<string>>(new Set())
  const initialLoadDoneRef = React.useRef(false)

  React.useEffect(() => {
    const matching = items.filter((i) => i.status === statusFilter)

    if (!initialLoadDoneRef.current) {
      matching.forEach((i) => notifiedIdsRef.current.add(i._id))
      initialLoadDoneRef.current = true
      return
    }

    for (const item of matching) {
      if (notifiedIdsRef.current.has(item._id)) continue
      notifiedIdsRef.current.add(item._id)
      playDing()
    }
  }, [items, statusFilter, playDing])
}

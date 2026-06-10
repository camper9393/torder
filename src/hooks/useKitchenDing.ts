"use client"

import React from "react"
import { getNewOrderSoundSrc } from "@/utils/kitchenDing"
import { getWaiterCallDingSrc } from "@/utils/waiterCallDing"

const NEW_ORDER_SOUND_VOLUME = 0.8
const WAITER_CALL_SOUND_VOLUME = 0.6

export function useKitchenDing() {
  const [soundEnabled, setSoundEnabled] = React.useState(false)
  const soundEnabledRef = React.useRef(false)
  const newOrderAudioRef = React.useRef<HTMLAudioElement | null>(null)
  const waiterAudioRef = React.useRef<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  const getNewOrderAudio = React.useCallback(() => {
    if (!newOrderAudioRef.current) {
      const src = getNewOrderSoundSrc()
      if (!src) return null
      newOrderAudioRef.current = new Audio(src)
      newOrderAudioRef.current.volume = NEW_ORDER_SOUND_VOLUME
      newOrderAudioRef.current.addEventListener("error", () => {
        newOrderAudioRef.current = null
      })
    }
    return newOrderAudioRef.current
  }, [])

  const getWaiterAudio = React.useCallback(() => {
    if (!waiterAudioRef.current) {
      const src = getWaiterCallDingSrc()
      if (!src) return null
      waiterAudioRef.current = new Audio(src)
      waiterAudioRef.current.volume = WAITER_CALL_SOUND_VOLUME
    }
    return waiterAudioRef.current
  }, [])

  const playClip = React.useCallback((getAudio: () => HTMLAudioElement | null) => {
    if (!soundEnabledRef.current) return
    const audio = getAudio()
    if (!audio) return
    audio.currentTime = 0
    void audio.play().catch(() => {})
  }, [])

  /** New incoming order — /sounds/NewOrder.wav */
  const playDing = React.useCallback(() => {
    playClip(getNewOrderAudio)
  }, [getNewOrderAudio, playClip])

  /** Waiter call alert — generated short ding */
  const playWaiterDing = React.useCallback(() => {
    playClip(getWaiterAudio)
  }, [getWaiterAudio, playClip])

  const enableSound = React.useCallback(async () => {
    const audio = getNewOrderAudio() ?? getWaiterAudio()
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
  }, [getNewOrderAudio, getWaiterAudio])

  return { soundEnabled, playDing, playWaiterDing, enableSound }
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

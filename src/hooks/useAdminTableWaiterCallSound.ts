"use client"

import React from "react"

const NOTIFIED_PREFIX = "admin-tables-notified-waiter-calls"

function storageKey(merchantId: string): string {
  return `${NOTIFIED_PREFIX}-${merchantId}`
}

function loadNotifiedIds(merchantId: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(storageKey(merchantId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === "string"))
  } catch {
    return new Set()
  }
}

function persistNotifiedIds(merchantId: string, ids: Set<string>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(storageKey(merchantId), JSON.stringify([...ids]))
}

/** Ding when a new waiter call appears on /admin/tables. */
export function useAdminTableWaiterCallSound(
  merchantId: string | undefined,
  waiterCallIds: string[],
  playDing: () => void,
  soundEnabled: boolean
) {
  const notifiedRef = React.useRef<Set<string>>(new Set())
  const initializedRef = React.useRef(false)

  React.useEffect(() => {
    if (!merchantId) return
    notifiedRef.current = loadNotifiedIds(merchantId)
    initializedRef.current = false
  }, [merchantId])

  React.useEffect(() => {
    if (!merchantId) return

    const persist = () => persistNotifiedIds(merchantId, notifiedRef.current)

    if (!initializedRef.current) {
      for (const id of waiterCallIds) notifiedRef.current.add(id)
      initializedRef.current = true
      persist()
      return
    }

    if (!soundEnabled) {
      for (const id of waiterCallIds) notifiedRef.current.add(id)
      persist()
      return
    }

    let played = false
    for (const id of waiterCallIds) {
      if (notifiedRef.current.has(id)) continue
      notifiedRef.current.add(id)
      if (!played) {
        playDing()
        played = true
      }
    }
    persist()
  }, [merchantId, waiterCallIds, playDing, soundEnabled])
}

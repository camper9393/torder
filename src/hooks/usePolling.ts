"use client"

import React from "react"

/**
 * Stable interval polling — callback identity does not recreate the interval.
 */
export function usePolling(
  tick: () => void | Promise<void>,
  intervalMs: number,
  enabled = true
) {
  const tickRef = React.useRef(tick)
  tickRef.current = tick

  React.useEffect(() => {
    if (!enabled) return

    const run = () => {
      void tickRef.current()
    }

    run()
    const id = window.setInterval(run, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, enabled])
}

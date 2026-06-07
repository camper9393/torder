/** Elapsed time since table/order started, e.g. "00:02" or "01:25" (HH:MM). */
export function formatOrderElapsed(
  isoTime: string | null,
  nowMs: number = Date.now()
): string {
  if (!isoTime) return ""

  const started = new Date(isoTime).getTime()
  if (Number.isNaN(started)) return ""

  const totalMins = Math.max(0, Math.floor((nowMs - started) / 60_000))
  const hrs = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

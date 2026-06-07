"use client"

import { cn } from "@/lib/utils"
import { clampSpicyLevel } from "@/utils/menuSpicy"

const CHILI_OUTLINE_SHADOW = [
  "-1px -1px 0 #111",
  "1px -1px 0 #111",
  "-1px 1px 0 #111",
  "1px 1px 0 #111",
  "0 0 4px rgba(0,0,0,0.75)",
  "0 1px 3px rgba(0,0,0,0.6)",
].join(", ")

/** White stroke that hugs the chili emoji shape (not a circle box). */
const CHILI_WHITE_CONTOUR = [
  "-1px -1px 0 #fff",
  "1px -1px 0 #fff",
  "-1px 1px 0 #fff",
  "1px 1px 0 #fff",
  "0 -1px 0 #fff",
  "0 1px 0 #fff",
  "-1px 0 0 #fff",
  "1px 0 0 #fff",
  "-1.5px -1.5px 0 #fff",
  "1.5px -1.5px 0 #fff",
  "-1.5px 1.5px 0 #fff",
  "1.5px 1.5px 0 #fff",
  "0 0 3px rgba(0,0,0,0.45)",
].join(", ")

type SpicyMenuBadgeProps = {
  /** 0 = hidden, 1–4 = chili count */
  level: number
  className?: string
  /** Tablet food cards — smaller chili with white contour outline */
  compact?: boolean
}

export function SpicyMenuBadge({ level, className, compact = false }: SpicyMenuBadgeProps) {
  const n = clampSpicyLevel(level)

  if (n <= 0) return null

  return (
    <span
      className={cn(
        "pointer-events-none absolute left-2 top-2 z-10 flex items-center gap-0.5",
        className
      )}
      aria-label={`Spicy level ${n}`}
    >
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "select-none leading-none",
            compact ? "text-sm md:text-base" : "text-lg sm:text-xl"
          )}
          style={{
            textShadow: compact ? CHILI_WHITE_CONTOUR : CHILI_OUTLINE_SHADOW,
          }}
        >
          🌶️
        </span>
      ))}
    </span>
  )
}

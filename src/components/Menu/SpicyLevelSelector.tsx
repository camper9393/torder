"use client"

import { cn } from "@/lib/utils"
import { clampSpicyLevel } from "@/utils/menuSpicy"
import { useLocale } from "@/context/LocaleContext"

function nextSpicyLevel(current: number): number {
  return (clampSpicyLevel(current) + 1) % 5
}

function CompactLevelDisplay({ level }: { level: number }) {
  const n = clampSpicyLevel(level)

  if (n === 0) {
    return <span className="leading-none">🚫</span>
  }

  return (
    <span className="inline-flex items-center gap-0.5 leading-none">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} aria-hidden>
          🌶️
        </span>
      ))}
    </span>
  )
}

type SpicyLevelSelectorProps = {
  value: number
  onChange: (level: number) => void
  disabled?: boolean
  className?: string
}

export function SpicyLevelSelector({
  value,
  onChange,
  disabled = false,
  className,
}: SpicyLevelSelectorProps) {
  const { t } = useLocale()
  const selected = clampSpicyLevel(value)

  const handleCycle = () => {
    if (disabled) return
    onChange(nextSpicyLevel(selected))
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        className
      )}
    >
      <span className="text-xs font-medium text-gray-600 shrink-0">
        {t.menu.spicyFieldLabel}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={handleCycle}
        aria-label={`Халууны түвшин: ${selected}. Өөрчлөхийн тулд дарна уу.`}
        className={cn(
          "inline-flex min-h-8 min-w-[2.75rem] items-center justify-center rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm transition touch-manipulation",
          "hover:border-gray-300 hover:bg-gray-50 active:scale-95",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <CompactLevelDisplay level={selected} />
      </button>
    </div>
  )
}

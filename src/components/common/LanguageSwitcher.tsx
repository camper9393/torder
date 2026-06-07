"use client"

import React from "react"
import Image from "next/image"
import { useLocale } from "@/context/LocaleContext"
import { cn } from "@/lib/utils"
import type { Locale } from "@/utils/i18n/types"

type ToggleLocale = "mn" | "en"

const MN_FLAG_SRC = "/img/flags/mn.png"

function activeToggleLocale(locale: Locale): ToggleLocale {
  return locale === "en" ? "en" : "mn"
}

function UsFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="16" fill="#B22234" />
      <rect y="1.23" width="24" height="1.23" fill="#FFF" />
      <rect y="3.69" width="24" height="1.23" fill="#FFF" />
      <rect y="6.15" width="24" height="1.23" fill="#FFF" />
      <rect y="8.62" width="24" height="1.23" fill="#FFF" />
      <rect y="11.08" width="24" height="1.23" fill="#FFF" />
      <rect y="13.54" width="24" height="1.23" fill="#FFF" />
      <rect width="10" height="8.6" fill="#3C3B6E" />
    </svg>
  )
}

type FlagOption = {
  code: ToggleLocale
  ariaMn: string
  ariaEn: string
  render: (className: string) => React.ReactNode
}

const FLAG_OPTIONS: FlagOption[] = [
  {
    code: "mn",
    ariaMn: "Монгол хэл",
    ariaEn: "Mongolian",
    render: (className) => (
      <Image
        src={MN_FLAG_SRC}
        alt=""
        width={28}
        height={20}
        className={className}
        aria-hidden
      />
    ),
  },
  {
    code: "en",
    ariaMn: "Англи хэл",
    ariaEn: "English",
    render: (className) => <UsFlagIcon className={className} />,
  },
]

type LanguageSwitcherProps = {
  className?: string
  compact?: boolean
  variant?: "default" | "paper"
}

function LanguageSwitcher({
  className,
  compact = false,
  variant = "default",
}: LanguageSwitcherProps) {
  const { locale, setLocale, t, ready } = useLocale()

  if (!ready) return null

  const active = activeToggleLocale(locale)
  const flagClass = cn(
    "rounded-sm object-cover",
    compact ? "h-5 w-7" : "h-5 w-7"
  )

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={cn("inline-flex items-center gap-2", className)}
    >
      {FLAG_OPTIONS.map(({ code, ariaMn, ariaEn, render }) => {
        const isActive = active === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-label={locale === "en" ? ariaEn : ariaMn}
            aria-pressed={isActive}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-sm p-0.5 transition touch-manipulation",
              compact ? "h-7 w-7" : "h-8 w-8",
              isActive
                ? variant === "paper"
                  ? "opacity-100 ring-1 ring-[#c9a227]/70"
                  : "opacity-100 ring-1 ring-slate-400/80"
                : "opacity-45 hover:opacity-70"
            )}
          >
            {render(flagClass)}
          </button>
        )
      })}
    </div>
  )
}

export default LanguageSwitcher

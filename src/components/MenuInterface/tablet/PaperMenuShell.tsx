"use client"

import { cn } from "@/lib/utils"
import { PAPER_BG } from "./tabletUi"

type PaperMenuShellProps = {
  children: React.ReactNode
  className?: string
}

export function PaperMenuShell({ children, className }: PaperMenuShellProps) {
  return (
    <div
      className={cn("relative min-h-screen overflow-x-hidden", className)}
      style={{ backgroundColor: PAPER_BG }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 20%, rgba(201,162,39,0.35) 0%, transparent 45%), radial-gradient(circle at 75% 80%, rgba(201,162,39,0.2) 0%, transparent 40%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}

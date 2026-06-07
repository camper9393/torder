"use client"

import { cn } from "@/lib/utils"

type TOrderMenuShellProps = {
  children: React.ReactNode
  className?: string
}

/** Clean Korean t'order-style tablet shell (ordering page only). */
export function TOrderMenuShell({ children, className }: TOrderMenuShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-white text-black",
        className
      )}
    >
      {children}
    </div>
  )
}

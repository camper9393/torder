"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { PAPER_MENU_ASSETS } from "./paperMenuAssets"
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
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url(${PAPER_MENU_ASSETS.solongo})`,
          backgroundSize: "280px",
          backgroundRepeat: "repeat",
        }}
        aria-hidden
      />

      <Image
        src={PAPER_MENU_ASSETS.fan}
        alt=""
        width={120}
        height={120}
        className="pointer-events-none absolute -left-6 top-24 z-0 opacity-25"
        aria-hidden
      />
      <Image
        src={PAPER_MENU_ASSETS.fan}
        alt=""
        width={100}
        height={100}
        className="pointer-events-none absolute -right-4 top-40 z-0 scale-x-[-1] opacity-20"
        aria-hidden
      />
      <Image
        src={PAPER_MENU_ASSETS.flower}
        alt=""
        width={88}
        height={88}
        className="pointer-events-none absolute bottom-32 left-2 z-0 opacity-30"
        aria-hidden
      />
      <Image
        src={PAPER_MENU_ASSETS.speechBubble}
        alt=""
        width={72}
        height={72}
        className="pointer-events-none absolute bottom-48 right-4 z-0 opacity-40 xl:hidden"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}

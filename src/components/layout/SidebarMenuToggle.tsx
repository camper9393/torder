"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export default function SidebarMenuToggle({
  className,
}: {
  className?: string
}) {
  const { open, toggleSidebar } = useSidebar()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 shrink-0 touch-manipulation text-slate-600 hover:text-slate-900",
        className
      )}
      onClick={toggleSidebar}
      aria-expanded={open}
      aria-label={open ? "Цэс нуух" : "Цэс нээх"}
    >
      <Menu className="h-4 w-4" />
    </Button>
  )
}

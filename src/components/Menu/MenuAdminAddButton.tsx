"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const menuAdminAddButtonClass =
  "h-10 min-h-10 rounded-[11px] border border-[#CBD5E1] bg-[#F8FAFC] px-3.5 text-sm font-medium text-[#334155] shadow-none transition-colors duration-200 hover:border-[#6366F1] hover:bg-[#EEF2FF] hover:text-[#4338CA] disabled:pointer-events-none disabled:opacity-50"

type MenuAdminAddButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function MenuAdminAddButton({
  children,
  onClick,
  disabled,
  className,
}: MenuAdminAddButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        menuAdminAddButtonClass,
        "justify-center gap-1.5",
        className
      )}
    >
      <Plus className="h-4 w-4 shrink-0" aria-hidden />
      {children}
    </Button>
  )
}

export { menuAdminAddButtonClass }

"use client"

import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type HallDeleteButtonProps = {
  onClick: () => void
  label?: string
  className?: string
}

export function HallDeleteButton({
  onClick,
  label = "Заал устгах",
  className,
}: HallDeleteButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "shrink-0 touch-manipulation gap-1.5 rounded-full border-red-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700",
        className
      )}
      onClick={onClick}
    >
      <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="text-xs font-semibold">{label}</span>
    </Button>
  )
}

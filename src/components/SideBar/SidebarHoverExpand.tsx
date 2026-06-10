"use client"

import { useEffect, useRef } from "react"
import { useSidebar } from "@/components/ui/sidebar"

/** Desktop: collapsed by default; expand on hover, collapse on leave. */
export default function SidebarHoverExpand() {
  const { isMobile, setOpen } = useSidebar()
  const setOpenRef = useRef(setOpen)
  setOpenRef.current = setOpen

  useEffect(() => {
    if (isMobile) return
    setOpenRef.current(false)
  }, [isMobile])

  useEffect(() => {
    if (isMobile) return

    const container = document.querySelector('[data-slot="sidebar-container"]')
    if (!container) return

    const onEnter = () => setOpenRef.current(true)
    const onLeave = () => setOpenRef.current(false)

    container.addEventListener("mouseenter", onEnter)
    container.addEventListener("mouseleave", onLeave)

    return () => {
      container.removeEventListener("mouseenter", onEnter)
      container.removeEventListener("mouseleave", onLeave)
    }
  }, [isMobile])

  return null
}

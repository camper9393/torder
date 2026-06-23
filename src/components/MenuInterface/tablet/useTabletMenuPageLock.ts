"use client"

import { useEffect } from "react"

const LOCK_CLASS = "tablet-menu-page-lock"

/** Locks html/body scroll while the consumer tablet menu is mounted. */
export function useTabletMenuPageLock() {
  useEffect(() => {
    document.documentElement.classList.add(LOCK_CLASS)
    return () => {
      document.documentElement.classList.remove(LOCK_CLASS)
    }
  }, [])
}

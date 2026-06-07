"use client"

import React from "react"
import type { CheckOutItems } from "@/store/reducer/checkout"

export type TabletCartContextValue = {
  open: boolean
  openCart: () => void
  closeCart: () => void
  historyOpen: boolean
  openHistory: () => void
  closeHistory: () => void
  recentLineKey: string | null
  notifyItemAdded: (line: CheckOutItems, displayName: string) => void
  openOrderConfirm: () => void
}

export const TabletCartContext =
  React.createContext<TabletCartContextValue | null>(null)

export function useTabletCartUi() {
  const ctx = React.useContext(TabletCartContext)
  if (!ctx) {
    throw new Error("useTabletCartUi must be used within TabletCartProvider")
  }
  return ctx
}

export function useTabletCartUiOptional() {
  return React.useContext(TabletCartContext)
}

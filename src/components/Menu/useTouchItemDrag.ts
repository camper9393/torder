"use client"

import React from "react"

const DRAG_THRESHOLD_PX = 10

type TouchDragHandlers = {
  onStart: (itemId: string) => void
  onMove: (clientX: number, clientY: number) => void
  onEnd: (clientX: number, clientY: number, itemId: string) => void
}

export function useTouchItemDrag(
  itemId: string,
  cardRef: React.RefObject<HTMLElement | null>,
  handlers: TouchDragHandlers
) {
  const sessionRef = React.useRef<{
    pointerId: number
    startX: number
    startY: number
    active: boolean
  } | null>(null)

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    return Boolean(target.closest("button, input, label, a, [data-no-drag]"))
  }

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse") return
    if (e.button !== 0 || isInteractiveTarget(e.target)) return

    sessionRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const session = sessionRef.current
    if (!session || session.pointerId !== e.pointerId) return

    const dx = e.clientX - session.startX
    const dy = e.clientY - session.startY

    if (!session.active) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      session.active = true
      handlers.onStart(itemId)
    }

    e.preventDefault()
    handlers.onMove(e.clientX, e.clientY)
  }

  const finish = (e: React.PointerEvent<HTMLElement>) => {
    const session = sessionRef.current
    if (!session || session.pointerId !== e.pointerId) return

    if (session.active) {
      handlers.onEnd(e.clientX, e.clientY, itemId)
    }

    sessionRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* capture already released */
    }
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerEnd: finish,
    onPointerCancel: finish,
  }
}

export function findItemDropSection(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY)
  const target = el?.closest("[data-item-drop-target]")
  return target?.getAttribute("data-item-drop-target") ?? null
}

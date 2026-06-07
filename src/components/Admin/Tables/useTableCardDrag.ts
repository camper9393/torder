import React from "react"

const CLICK_SUPPRESS_MS = 300

export function useTableCardDrag({
  tableName,
  layoutDragActive,
  onDragStart,
  onDragEnd,
}: {
  tableName: string
  layoutDragActive?: boolean
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const suppressClickRef = React.useRef(false)
  const suppressTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const armClickSuppress = React.useCallback(() => {
    suppressClickRef.current = true
    if (suppressTimerRef.current) {
      clearTimeout(suppressTimerRef.current)
    }
    suppressTimerRef.current = setTimeout(() => {
      suppressClickRef.current = false
      suppressTimerRef.current = null
    }, CLICK_SUPPRESS_MS)
  }, [])

  React.useEffect(
    () => () => {
      if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current)
    },
    []
  )

  const handleDragStart = React.useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      suppressClickRef.current = true
      e.dataTransfer.effectAllowed = "move"
      e.dataTransfer.setData("text/plain", tableName)
      const node = e.currentTarget
      if (e.dataTransfer.setDragImage) {
        e.dataTransfer.setDragImage(node, Math.min(48, node.offsetWidth / 2), 24)
      }
      onDragStart()
    },
    [tableName, onDragStart]
  )

  const handleDragEnd = React.useCallback(() => {
    onDragEnd()
    armClickSuppress()
  }, [onDragEnd, armClickSuppress])

  const shouldIgnoreClick = React.useCallback(() => {
    return suppressClickRef.current || Boolean(layoutDragActive)
  }, [layoutDragActive])

  return {
    handleDragStart,
    handleDragEnd,
    shouldIgnoreClick,
    armClickSuppress,
  }
}

"use client"

import React from "react"
import { ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

export const DEFAULT_CHART_HEIGHT = 260

type ChartResponsiveContainerProps = {
  children: React.ReactElement
  className?: string
  height?: number
}

export function ChartResponsiveContainer({
  children,
  className,
  height = DEFAULT_CHART_HEIGHT,
}: ChartResponsiveContainerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [ready, setReady] = React.useState(false)

  React.useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateReady = () => {
      const { width, height: measuredHeight } = el.getBoundingClientRect()
      setReady(width > 0 && measuredHeight > 0)
    }

    updateReady()

    const observer = new ResizeObserver(updateReady)
    observer.observe(el)

    return () => observer.disconnect()
  }, [height])

  const minHeight = Math.max(200, height - 10)

  return (
    <div
      ref={containerRef}
      className={cn("w-full min-w-0", className)}
      style={{ height, minHeight: height }}
    >
      {ready ? (
        <ResponsiveContainer
          width="100%"
          height={height}
          minWidth={0}
          minHeight={minHeight}
          initialDimension={{ width: 0, height }}
        >
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  )
}

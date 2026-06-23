"use client"

import * as React from "react"

type UseContinuousCategoryScrollOptions = {
  categories: string[]
}

type SectionOffset = {
  category: string
  top: number
}

const SCROLL_ANCHOR_GAP = 12

function measureSectionOffsets(
  container: HTMLElement,
  categories: string[],
  sectionElements: Map<string, HTMLElement>
): SectionOffset[] {
  const scrollTop = container.scrollTop
  const containerTop = container.getBoundingClientRect().top
  const offsets: SectionOffset[] = []

  for (const category of categories) {
    const section = sectionElements.get(category)
    if (!section) continue
    offsets.push({
      category,
      top: section.getBoundingClientRect().top - containerTop + scrollTop,
    })
  }

  return offsets
}

function pickActiveFromOffsets(
  scrollTop: number,
  offsets: SectionOffset[],
  fallback: string
): string {
  if (offsets.length === 0) return fallback

  const anchor = scrollTop + SCROLL_ANCHOR_GAP
  let current = offsets[0].category

  for (const { category, top } of offsets) {
    if (top <= anchor) {
      current = category
    } else {
      break
    }
  }

  return current
}

export function useContinuousCategoryScroll({
  categories,
}: UseContinuousCategoryScrollOptions) {
  const scrollRef = React.useRef<HTMLElement>(null)
  const sectionElementsRef = React.useRef<Map<string, HTMLElement>>(new Map())
  const scrollLockRef = React.useRef(false)
  const scrollLockTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const categoriesRef = React.useRef(categories)
  const activeCategoryRef = React.useRef("")
  const offsetsRef = React.useRef<SectionOffset[]>([])
  const rafRef = React.useRef(0)

  const [activeCategory, setActiveCategory] = React.useState("")

  React.useEffect(() => {
    categoriesRef.current = categories
  }, [categories])

  React.useEffect(() => {
    activeCategoryRef.current = activeCategory
  }, [activeCategory])

  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      const first = categories[0]
      activeCategoryRef.current = first
      setActiveCategory(first)
    }
  }, [categories, activeCategory])

  const invalidateOffsets = React.useCallback(() => {
    offsetsRef.current = []
  }, [])

  const refreshOffsets = React.useCallback(() => {
    const container = scrollRef.current
    if (!container) return

    offsetsRef.current = measureSectionOffsets(
      container,
      categoriesRef.current,
      sectionElementsRef.current
    )
  }, [])

  const applyActiveCategory = React.useCallback((next: string) => {
    if (!next || activeCategoryRef.current === next) return
    activeCategoryRef.current = next
    setActiveCategory(next)
  }, [])

  const syncActiveCategory = React.useCallback(() => {
    if (scrollLockRef.current) return

    const container = scrollRef.current
    const cats = categoriesRef.current
    if (!container || cats.length === 0) return

    if (offsetsRef.current.length !== cats.length) {
      refreshOffsets()
    }

    const offsets = offsetsRef.current
    if (offsets.length === 0) return

    applyActiveCategory(
      pickActiveFromOffsets(container.scrollTop, offsets, cats[0])
    )
  }, [applyActiveCategory, refreshOffsets])

  const scheduleSyncActiveCategory = React.useCallback(() => {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      syncActiveCategory()
    })
  }, [syncActiveCategory])

  const setSectionRef = React.useCallback(
    (category: string) => (el: HTMLElement | null) => {
      if (el) {
        sectionElementsRef.current.set(category, el)
      } else {
        sectionElementsRef.current.delete(category)
      }
      invalidateOffsets()
    },
    [invalidateOffsets]
  )

  const scrollToCategory = React.useCallback(
    (category: string) => {
      const container = scrollRef.current
      const section = sectionElementsRef.current.get(category)
      if (!container || !section) {
        applyActiveCategory(category)
        return
      }

      scrollLockRef.current = true
      if (scrollLockTimerRef.current) {
        clearTimeout(scrollLockTimerRef.current)
      }

      applyActiveCategory(category)

      refreshOffsets()
      const offset = offsetsRef.current.find((entry) => entry.category === category)
      const targetScroll = offset?.top ?? container.scrollTop

      container.scrollTo({ top: targetScroll, behavior: "smooth" })

      scrollLockTimerRef.current = setTimeout(() => {
        scrollLockRef.current = false
        invalidateOffsets()
        scheduleSyncActiveCategory()
      }, 700)
    },
    [applyActiveCategory, invalidateOffsets, refreshOffsets, scheduleSyncActiveCategory]
  )

  React.useEffect(() => {
    const container = scrollRef.current
    if (!container || categories.length === 0) return

    const onScroll = () => {
      scheduleSyncActiveCategory()
    }

    container.addEventListener("scroll", onScroll, { passive: true })

    const resizeObserver = new ResizeObserver(() => {
      invalidateOffsets()
      scheduleSyncActiveCategory()
    })

    resizeObserver.observe(container)

    const observer = new IntersectionObserver(
      () => {
        scheduleSyncActiveCategory()
      },
      {
        root: container,
        rootMargin: "-12px 0px -55% 0px",
        threshold: [0, 0.01, 0.25, 0.5],
      }
    )

    const observeSections = () => {
      observer.disconnect()
      for (const category of categoriesRef.current) {
        const el = sectionElementsRef.current.get(category)
        if (el) observer.observe(el)
      }
    }

    observeSections()

    const sectionMutationTimer = setTimeout(() => {
      refreshOffsets()
      observeSections()
      syncActiveCategory()
    }, 0)

    return () => {
      container.removeEventListener("scroll", onScroll)
      resizeObserver.disconnect()
      observer.disconnect()
      clearTimeout(sectionMutationTimer)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
    }
  }, [
    categories,
    invalidateOffsets,
    refreshOffsets,
    scheduleSyncActiveCategory,
    syncActiveCategory,
  ])

  React.useEffect(() => {
    return () => {
      if (scrollLockTimerRef.current) {
        clearTimeout(scrollLockTimerRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return {
    scrollRef,
    activeCategory,
    setSectionRef,
    scrollToCategory,
  }
}

"use client"

import * as React from "react"

type UseContinuousCategoryScrollOptions = {
  categories: string[]
}

function pickActiveCategoryFromScroll(
  container: HTMLElement,
  categories: string[],
  sectionElements: Map<string, HTMLElement>
): string | null {
  if (categories.length === 0) return null

  const anchorTop = container.getBoundingClientRect().top + 12
  let current = categories[0]

  for (const category of categories) {
    const section = sectionElements.get(category)
    if (!section) continue

    if (section.getBoundingClientRect().top <= anchorTop) {
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

  const [activeCategory, setActiveCategory] = React.useState("")

  React.useEffect(() => {
    categoriesRef.current = categories
  }, [categories])

  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0])
    }
  }, [categories, activeCategory])

  const syncActiveCategory = React.useCallback(() => {
    if (scrollLockRef.current) return

    const container = scrollRef.current
    if (!container) return

    const next = pickActiveCategoryFromScroll(
      container,
      categoriesRef.current,
      sectionElementsRef.current
    )

    if (next) {
      setActiveCategory((prev) => (prev === next ? prev : next))
    }
  }, [])

  const setSectionRef = React.useCallback(
    (category: string) => (el: HTMLElement | null) => {
      if (el) {
        sectionElementsRef.current.set(category, el)
      } else {
        sectionElementsRef.current.delete(category)
      }
    },
    []
  )

  const scrollToCategory = React.useCallback((category: string) => {
    const container = scrollRef.current
    const section = sectionElementsRef.current.get(category)
    if (!container || !section) {
      setActiveCategory(category)
      return
    }

    scrollLockRef.current = true
    if (scrollLockTimerRef.current) {
      clearTimeout(scrollLockTimerRef.current)
    }

    setActiveCategory(category)

    const containerTop = container.getBoundingClientRect().top
    const sectionTop = section.getBoundingClientRect().top
    const targetScroll = container.scrollTop + (sectionTop - containerTop)

    container.scrollTo({ top: targetScroll, behavior: "smooth" })

    scrollLockTimerRef.current = setTimeout(() => {
      scrollLockRef.current = false
      syncActiveCategory()
    }, 700)
  }, [syncActiveCategory])

  React.useEffect(() => {
    const container = scrollRef.current
    if (!container || categories.length === 0) return

    const onScroll = () => {
      syncActiveCategory()
    }

    container.addEventListener("scroll", onScroll, { passive: true })
    syncActiveCategory()

    const observer = new IntersectionObserver(
      () => {
        syncActiveCategory()
      },
      {
        root: container,
        rootMargin: "-8px 0px -65% 0px",
        threshold: [0, 0.01, 0.1],
      }
    )

    for (const category of categories) {
      const el = sectionElementsRef.current.get(category)
      if (el) observer.observe(el)
    }

    return () => {
      container.removeEventListener("scroll", onScroll)
      observer.disconnect()
    }
  }, [categories, syncActiveCategory])

  React.useEffect(() => {
    return () => {
      if (scrollLockTimerRef.current) {
        clearTimeout(scrollLockTimerRef.current)
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

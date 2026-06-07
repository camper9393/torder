/** True only when the menu document has spicy explicitly set to true. */
export function isMenuSpicy(spicy: unknown): boolean {
  return spicy === true
}

/** Parse spicy from API/form payloads (boolean or string). */
export function parseSpicyValue(value: unknown): boolean | null {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false
  }
  return null
}

/** Clamp menu spicy level to 0–4 for display. */
export function clampSpicyLevel(level: number): number {
  if (!Number.isFinite(level)) return 0
  return Math.min(4, Math.max(0, Math.floor(level)))
}

/**
 * Resolve display level: prefer spicyLevel (0–4), else legacy boolean spicy → 1.
 */
export function normalizeSpicyLevel(
  spicyLevel?: unknown,
  spicy?: unknown
): number {
  if (spicyLevel !== undefined && spicyLevel !== null && spicyLevel !== "") {
    const n =
      typeof spicyLevel === "number"
        ? spicyLevel
        : Number.parseInt(String(spicyLevel), 10)
    if (!Number.isNaN(n)) {
      return clampSpicyLevel(n)
    }
  }
  return isMenuSpicy(spicy) ? 1 : 0
}

/** Chili icons for level 1–4 (empty string for 0). */
export function spicyLevelIcons(level: number): string {
  const n = clampSpicyLevel(level)
  if (n <= 0) return ""
  return "🌶️".repeat(n)
}

/** Parse spicyLevel from API/form payloads (0–4). */
export function parseSpicyLevel(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null
  }
  const n =
    typeof value === "number" ? value : Number.parseInt(String(value), 10)
  if (Number.isNaN(n) || n < 0 || n > 4) {
    return null
  }
  return clampSpicyLevel(n)
}

/** Build MongoDB update fields for spicy level. */
export function spicyLevelToDbFields(level: number): {
  spicyLevel: number
  spicy: boolean
} {
  const spicyLevel = clampSpicyLevel(level)
  return { spicyLevel, spicy: spicyLevel > 0 }
}
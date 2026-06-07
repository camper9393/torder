export type SectionMetaEntry = {
  labelMn: string
  labelEn: string
}

export type SectionMetaMap = Record<string, SectionMetaEntry>

export function sanitizeSectionMeta(
  raw: Record<string, unknown> | null | undefined
): SectionMetaMap {
  if (!raw || typeof raw !== "object") return {}

  const next: SectionMetaMap = {}
  for (const [key, value] of Object.entries(raw)) {
    if (typeof key !== "string" || !key.trim()) continue
    if (!value || typeof value !== "object") continue
    const entry = value as Record<string, unknown>
    const labelMn =
      typeof entry.labelMn === "string" ? entry.labelMn.trim() : ""
    const labelEn =
      typeof entry.labelEn === "string" ? entry.labelEn.trim() : ""
    if (!labelMn) continue
    next[key] = { labelMn, labelEn: labelEn || labelMn }
  }
  return next
}

export function buildSectionMetaFromKeys(
  keys: string[],
  saved: SectionMetaMap = {}
): SectionMetaMap {
  const next: SectionMetaMap = { ...saved }
  for (const key of keys) {
    if (!next[key]) {
      next[key] = { labelMn: key, labelEn: key }
    }
  }
  return next
}

/** Display label for a menu section key (labelMn / labelEn from category admin). */
export function resolveSectionLabel(
  sectionKey: string,
  meta: SectionMetaMap | undefined,
  locale: "mn" | "en" | "ko" = "mn"
): string {
  const entry = meta?.[sectionKey]
  if (!entry) return sectionKey

  if (locale === "en") {
    return entry.labelEn?.trim() || entry.labelMn?.trim() || sectionKey
  }

  return entry.labelMn?.trim() || sectionKey
}

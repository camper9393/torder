/** UI-only food emoji hints for table card previews */
export function emojiForMenuItem(title: string, index: number): string {
  const t = title.toLowerCase()
  if (/шөл|soup|ramen|noodle|ногоо/.test(t)) return "🍜"
  if (/манду|mandu|dumpling|банш|buuz/.test(t)) return "🥟"
  if (/кола|cola|coffee|кофе|juice|жүүс|drink|унда/.test(t)) return "🥤"
  if (/салат|salad/.test(t)) return "🥗"
  if (/мах|beef|steak|хориг/.test(t)) return "🍖"
  if (/бор|rice|тос/.test(t)) return "🍚"
  const defaults = ["🍽️", "🍜", "🥟", "🥤"]
  return defaults[index % defaults.length]
}

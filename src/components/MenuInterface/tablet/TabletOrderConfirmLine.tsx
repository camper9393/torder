"use client"

import Image from "next/image"
import { ImagePlus } from "lucide-react"
import { CheckOutItems } from "@/store/reducer/checkout"
import { formatPrice } from "@/utils/currency"
import { useLocale } from "@/context/LocaleContext"
import { normalizeMenuDocument, resolveMenuName, resolveStoredPortionLabel } from "@/utils/menuBilingual"

type TabletOrderConfirmLineProps = {
  item: CheckOutItems
}

function resolvePortionLabel(
  item: CheckOutItems,
  locale: "mn" | "en" | "ko"
): string | null {
  return resolveStoredPortionLabel(
    item.selectedSizeLabelMn,
    item.selectedSizeLabelEn,
    locale
  )
}

function TabletOrderConfirmLine({ item }: TabletOrderConfirmLineProps) {
  const { locale, t } = useLocale()
  const normalized = normalizeMenuDocument(item)
  const displayName = resolveMenuName(normalized, locale)
  const portionLabel = resolvePortionLabel(item, locale)
  const imageSrc = item.image?.trim()
  const lineTotal = item.price * item.itemCount

  return (
    <li className="tablet-themed-history-line flex items-center gap-3 py-3 last:border-b-0">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--tablet-image-bg)" }}>
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={displayName}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="tablet-themed-muted flex h-full w-full items-center justify-center">
            <ImagePlus className="h-5 w-5" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{displayName}</p>
        {portionLabel ? (
          <p className="tablet-themed-muted truncate text-xs">{portionLabel}</p>
        ) : null}
        <p className="tablet-themed-muted mt-0.5 text-xs font-medium">
          {t.tablet.qtyLabel}{" "}
          <span className="font-bold tabular-nums">{item.itemCount}</span>
        </p>
      </div>

      <span className="shrink-0 text-sm font-extrabold tabular-nums">
        {formatPrice(lineTotal)}
      </span>
    </li>
  )
}

export default TabletOrderConfirmLine

"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Tablet } from "lucide-react"
import { buildConsumerMenuUrl } from "@/utils/table"
import { subscribeRestaurantInfoUpdated } from "@/utils/restaurantInfoRefresh"
import {
  DEFAULT_TABLET_TEXT_SCALE,
  DEFAULT_TABLET_UI_SCALE,
  normalizeTabletTextScale,
  normalizeTabletUiScale,
  TEXT_SCALE_PERCENT_MAX,
  TEXT_SCALE_PERCENT_MIN,
  TEXT_SCALE_PERCENT_STEP,
  UI_SCALE_PERCENT_MAX,
  UI_SCALE_PERCENT_MIN,
  UI_SCALE_PERCENT_STEP,
  uiScaleToPercent,
  textScaleToPercent,
} from "@/utils/tabletUiScale"
import {
  DEFAULT_TABLET_THEME,
  normalizeTabletTheme,
  TABLET_THEME_OPTIONS,
  type TabletThemeId,
} from "@/utils/tabletTheme"
import toast from "react-hot-toast"
import { patchApi } from "@/utils/common"
import { PATCH_ADMIN_SETTINGS_TABLET_DISPLAY } from "@/utils/APIConstant"
import { ApiResponse } from "@/utils/api"
import { cn } from "@/lib/utils"

const PREVIEW_WIDTH = 1280
const PREVIEW_HEIGHT = 800

type TabletOrderPreviewSectionProps = {
  merchantId: string
  previewTableName: string
  origin: string
  uiScale: number
  textScale: number
  theme: TabletThemeId
  onSettingsChange: (values: {
    uiScale: number
    textScale: number
    theme: TabletThemeId
  }) => void
}

type TabletDisplaySettingsResponse = {
  uiScale: number
  textScale: number
  theme: TabletThemeId
}

type ScaleSliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}

function ScaleSlider({
  label,
  value,
  min,
  max,
  step,
  unit = "%",
  onChange,
}: ScaleSliderProps) {
  return (
    <div className="flex-1 min-w-[14rem]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className="text-sm font-bold tabular-nums text-green-700">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer touch-manipulation accent-green-600"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}

export default function TabletOrderPreviewSection({
  merchantId,
  previewTableName,
  origin,
  uiScale,
  textScale,
  theme,
  onSettingsChange,
}: TabletOrderPreviewSectionProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = React.useState(0.55)
  const [draftUiPercent, setDraftUiPercent] = React.useState(() =>
    uiScaleToPercent(uiScale)
  )
  const [draftTextPercent, setDraftTextPercent] = React.useState(() =>
    textScaleToPercent(textScale)
  )
  const [draftTheme, setDraftTheme] = React.useState<TabletThemeId>(theme)
  const [saving, setSaving] = React.useState(false)
  const [previewRefresh, setPreviewRefresh] = React.useState(0)

  React.useEffect(() => {
    return subscribeRestaurantInfoUpdated(() => {
      setPreviewRefresh((n) => n + 1)
    })
  }, [])

  React.useEffect(() => {
    setDraftUiPercent(uiScaleToPercent(uiScale))
  }, [uiScale])

  React.useEffect(() => {
    setDraftTextPercent(textScaleToPercent(textScale))
  }, [textScale])

  React.useEffect(() => {
    setDraftTheme(theme)
  }, [theme])

  React.useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const updateFit = () => {
      const availableWidth = el.clientWidth - 24
      const availableHeight = el.clientHeight - 24
      const scaleW = availableWidth / PREVIEW_WIDTH
      const scaleH = availableHeight / PREVIEW_HEIGHT
      setFitScale(Math.min(scaleW, scaleH, 1))
    }

    updateFit()
    const observer = new ResizeObserver(updateFit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const savedUiPercent = uiScaleToPercent(uiScale)
  const savedTextPercent = textScaleToPercent(textScale)

  const previewSrc = React.useMemo(() => {
    if (!previewTableName || !merchantId) return ""
    const options: {
      preview: true
      uiScale?: number
      textScale?: number
      theme?: TabletThemeId
    } = { preview: true }

    if (draftUiPercent !== savedUiPercent) {
      options.uiScale = draftUiPercent
    }
    if (draftTextPercent !== savedTextPercent) {
      options.textScale = draftTextPercent
    }
    if (draftTheme !== theme) {
      options.theme = draftTheme
    }

    return buildConsumerMenuUrl(merchantId, previewTableName, origin, {
      ...options,
      cacheBust: previewRefresh || undefined,
    })
  }, [
    merchantId,
    previewTableName,
    origin,
    draftUiPercent,
    draftTextPercent,
    draftTheme,
    savedUiPercent,
    savedTextPercent,
    theme,
    previewRefresh,
  ])

  const handleSave = async () => {
    if (!merchantId) {
      toast.error("Restaurant ID олдсонгүй. Дахин нэвтэрнэ үү.")
      return
    }

    setSaving(true)
    try {
      const res = await patchApi<ApiResponse<TabletDisplaySettingsResponse>>({
        url: PATCH_ADMIN_SETTINGS_TABLET_DISPLAY(merchantId),
        values: {
          uiScale: draftUiPercent,
          textScale: draftTextPercent,
          theme: draftTheme,
        },
      })
      if (res?.success && res.data) {
        onSettingsChange({
          uiScale: normalizeTabletUiScale(res.data.uiScale),
          textScale: normalizeTabletTextScale(
            res.data.textScale ?? DEFAULT_TABLET_TEXT_SCALE
          ),
          theme: normalizeTabletTheme(res.data.theme ?? DEFAULT_TABLET_THEME),
        })
        toast.success("Таблет тохиргоо хадгалагдлаа")
      } else {
        toast.error(res?.message || "Хадгалахад алдаа гарлаа")
      }
    } catch {
      toast.error("Хадгалахад алдаа гарлаа")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="relative mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:items-end">
          <ScaleSlider
            label="Ерөнхий хэмжээ"
            value={draftUiPercent}
            min={UI_SCALE_PERCENT_MIN}
            max={UI_SCALE_PERCENT_MAX}
            step={UI_SCALE_PERCENT_STEP}
            onChange={setDraftUiPercent}
          />
          <ScaleSlider
            label="Текстийн хэмжээ"
            value={draftTextPercent}
            min={TEXT_SCALE_PERCENT_MIN}
            max={TEXT_SCALE_PERCENT_MAX}
            step={TEXT_SCALE_PERCENT_STEP}
            onChange={setDraftTextPercent}
          />
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => void handleSave()}
            className="min-h-11 shrink-0 lg:mb-1"
          >
            {saving ? "Хадгалж байна…" : "Хадгалах"}
          </Button>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Theme</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {TABLET_THEME_OPTIONS.map((option) => {
              const selected = draftTheme === option.id
              const swatch = option.previewColors
                ? {
                    a: option.previewColors[0],
                    b: option.previewColors[1],
                    c: option.previewColors[2],
                    d: option.previewColors[3],
                  }
                : option.id === "dark"
                  ? {
                      a: "#1e1f22",
                      b: "#2b2d31",
                      c: "#202225",
                      d: "#202225",
                    }
                  : option.id === "light"
                    ? {
                        a: "#e5e7eb",
                        b: "#f9fafb",
                        c: "#f3f4f6",
                        d: "#f3f4f6",
                      }
                    : {
                        a: "#3a2a20",
                        b: "#f4eadc",
                        c: "#efe4d3",
                        d: "#efe4d3",
                      }

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDraftTheme(option.id)}
                  className={cn(
                    "flex flex-col rounded-xl border p-3 text-left transition touch-manipulation",
                    selected
                      ? "border-green-600 ring-2 ring-green-600/30"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                  aria-pressed={selected}
                >
                  <div className="mb-2 flex h-10 overflow-hidden rounded-lg border border-black/10">
                    <span
                      className="w-1/4"
                      style={{ background: swatch.a }}
                      aria-hidden
                    />
                    <span
                      className="w-1/4"
                      style={{ background: swatch.b }}
                      aria-hidden
                    />
                    <span
                      className="w-1/4"
                      style={{ background: swatch.c }}
                      aria-hidden
                    />
                    <span
                      className="w-1/4"
                      style={{ background: swatch.d }}
                      aria-hidden
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {option.label}
                  </span>
                  <span className="mt-0.5 text-xs leading-snug text-slate-500">
                    {option.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <p className="mb-3 flex items-start gap-2 text-sm leading-relaxed text-slate-500">
        <Tablet className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
        <span>
          Энэ хэсэгт таны таблет меню ширээн дээр хэрхэн харагдахыг урьдчилан харуулна.
          Дээрх тохиргоог хадгалснаар тухайн рестораны бүх таблет дээр автоматаар
          адилхан харагдана.
        </span>
      </p>

      <div
        ref={viewportRef}
        className="relative w-full overflow-hidden rounded-2xl border-4 border-slate-800 bg-slate-900 p-3 shadow-inner"
        style={{ aspectRatio: "16 / 10", minHeight: 280 }}
      >
        {previewSrc ? (
          <div
            className="relative overflow-hidden rounded-lg bg-white shadow-lg"
            style={{
              width: PREVIEW_WIDTH * fitScale,
              height: PREVIEW_HEIGHT * fitScale,
            }}
          >
            <iframe
              key={previewSrc}
              title="Tablet menu preview"
              src={previewSrc}
              width={PREVIEW_WIDTH}
              height={PREVIEW_HEIGHT}
              className="absolute left-0 top-0 border-0 bg-white"
              style={{
                transform: `scale(${fitScale})`,
                transformOrigin: "top left",
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

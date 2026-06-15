"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useDropzone, type FileRejection } from "react-dropzone"
import { ImagePlus, Plus, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SpicyLevelSelector } from "./SpicyLevelSelector"
import type { MenuSizeOption } from "@/types/menu"
import { clampSpicyLevel } from "@/utils/menuSpicy"
import {
  emptySizeRow,
  resolveMenuPrice,
  sizesFromFormRows,
  sizesToFormRows,
  type MenuFormSizeRow,
} from "@/utils/menuBilingual"

export type MenuItemFormMode = "create" | "edit"

export type MenuItemFormValues = {
  nameMn: string
  nameEn: string
  descriptionMn: string
  descriptionEn: string
  price: string
  section: string
  spicyLevel: number
  available: boolean
  imagePreview: string | null
  imageFile: File | null
  sizes: MenuFormSizeRow[]
}

export const emptyMenuItemFormValues = (
  defaultSection = ""
): MenuItemFormValues => ({
  nameMn: "",
  nameEn: "",
  descriptionMn: "",
  descriptionEn: "",
  price: "",
  section: defaultSection,
  spicyLevel: 0,
  available: true,
  imagePreview: null,
  imageFile: null,
  sizes: [],
})

export type EditableMenuItem = {
  id: string
  section: string
  nameMn: string
  nameEn: string
  descriptionMn?: string
  descriptionEn?: string
  price: number
  image: string
  spicyLevel: number
  available: boolean
  sizes?: MenuSizeOption[]
}

export function menuItemToFormValues(item: EditableMenuItem): MenuItemFormValues {
  return {
    nameMn: item.nameMn,
    nameEn: item.nameEn,
    descriptionMn: item.descriptionMn ?? "",
    descriptionEn: item.descriptionEn ?? "",
    price: String(item.price),
    section: item.section,
    spicyLevel: clampSpicyLevel(item.spicyLevel),
    available: item.available,
    imagePreview: item.image?.trim() ? item.image : null,
    imageFile: null,
    sizes: sizesToFormRows(item.sizes),
  }
}

const MAX_IMAGE_SIZE = 12 * 1024 * 1024

const IMAGE_RECOMMENDATION = (
  <div className="mt-2 w-full max-w-[260px] text-left text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
    <p className="font-medium text-foreground/80">Зөвлөмж:</p>
    <ul className="mt-1 list-none space-y-0.5">
      <li>• Харьцаа: 4:3 буюу өргөн тэгш өнцөгт</li>
      <li>• Хамгийн тохиромжтой: 1200 × 900 px</li>
      <li>• Хамгийн багадаа: 800 × 600 px</li>
      <li>• Формат: JPG, PNG, WEBP</li>
      <li>• Файлын хэмжээ: 5MB хүртэл</li>
    </ul>
  </div>
)

const TARGET_ASPECT_RATIO = 4 / 3

/** ~10% tolerance from 4:3 */
function isNearFourThreeAspectRatio(width: number, height: number): boolean {
  if (width <= 0 || height <= 0) return true
  const ratio = width / height
  const deviation = Math.abs(ratio - TARGET_ASPECT_RATIO) / TARGET_ASPECT_RATIO
  return deviation <= 0.1
}

type MenuItemFormProps = {
  mode: MenuItemFormMode
  idPrefix: string
  values: MenuItemFormValues
  onChange: (values: MenuItemFormValues) => void
  sectionOptions: string[]
  disabled?: boolean
}

export function MenuItemForm({
  mode,
  idPrefix,
  values,
  onChange,
  sectionOptions,
  disabled = false,
}: MenuItemFormProps) {
  const [aspectWarning, setAspectWarning] = useState(false)

  useEffect(() => {
    if (!values.imagePreview) {
      setAspectWarning(false)
      return
    }

    const img = new window.Image()
    img.onload = () => {
      setAspectWarning(!isNearFourThreeAspectRatio(img.naturalWidth, img.naturalHeight))
    }
    img.onerror = () => setAspectWarning(false)
    img.src = values.imagePreview

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [values.imagePreview])

  const patch = (partial: Partial<MenuItemFormValues>) => {
    onChange({ ...values, ...partial })
  }

  const hasSizes = values.sizes.length > 0
  const parsedSizes = sizesFromFormRows(values.sizes)
  const displayPrice = hasSizes
    ? resolveMenuPrice(0, parsedSizes)
    : Number(values.price)

  const onDrop = (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles.length > 0) {
      const code = rejectedFiles[0].errors[0]?.code
      if (code === "file-too-large") toast.error("Зураг 12MB-аас бага байх ёстой")
      else toast.error("Зураг буруу форматтай байна")
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    patch({
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    maxSize: MAX_IMAGE_SIZE,
    disabled,
  })

  const updateSizeRow = (index: number, row: Partial<MenuFormSizeRow>) => {
    const sizes = values.sizes.map((r, i) =>
      i === index ? { ...r, ...row } : r
    )
    patch({ sizes })
  }

  const removeSizeRow = (index: number) => {
    patch({ sizes: values.sizes.filter((_, i) => i !== index) })
  }

  const addSizeRow = () => {
    patch({ sizes: [...values.sizes, emptySizeRow()] })
  }

  const nameMnId = `${idPrefix}-name-mn`
  const nameEnId = `${idPrefix}-name-en`
  const descMnId = `${idPrefix}-desc-mn`
  const descEnId = `${idPrefix}-desc-en`
  const priceId = `${idPrefix}-price`

  return (
    <div className="space-y-4 py-2">
      <div className="mx-auto w-full max-w-[320px] space-y-2">
        <div
          {...getRootProps()}
          className={`relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/30 ${
            isDragActive ? "ring-2 ring-primary" : ""
          }`}
        >
          <input {...getInputProps()} />
          {values.imagePreview ? (
            <Image
              src={values.imagePreview}
              alt={values.nameMn || values.nameEn || "Хоол"}
              fill
              className="object-contain object-center"
              unoptimized={values.imagePreview.startsWith("blob:")}
              sizes="320px"
            />
          ) : (
            <div className="flex max-h-full flex-col items-center justify-center gap-2 overflow-y-auto px-3 py-4 text-center text-muted-foreground sm:px-4">
              <ImagePlus className="h-8 w-8 shrink-0" />
              <span className="text-sm font-medium">Зураг байхгүй</span>
              <span className="text-xs">
                {mode === "create"
                  ? "Зураг оруулах (заавал)"
                  : "Дарж эсвэл чирж зураг оруулна"}
              </span>
              {IMAGE_RECOMMENDATION}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Зураг өргөн тэгш өнцөгт байвал таблет дээр хамгийн зөв харагдана.
        </p>

        {aspectWarning ? (
          <p className="text-center text-xs font-medium text-amber-700" role="status">
            Анхаар: 4:3 харьцаатай зураг ашиглавал таблет дээр илүү зөв харагдана.
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={nameMnId}>
            Монгол нэр
          </label>
          <Input
            id={nameMnId}
            value={values.nameMn}
            onChange={(e) => patch({ nameMn: e.target.value })}
            disabled={disabled}
            placeholder="Мэню нэр"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={nameEnId}>
            Англи нэр
          </label>
          <Input
            id={nameEnId}
            value={values.nameEn}
            onChange={(e) => patch({ nameEn: e.target.value })}
            disabled={disabled}
            placeholder="Menu name"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={descMnId}>
            Монгол тайлбар
          </label>
          <Input
            id={descMnId}
            value={values.descriptionMn}
            onChange={(e) => patch({ descriptionMn: e.target.value })}
            disabled={disabled}
            placeholder="Заавал биш"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={descEnId}>
            Англи тайлбар
          </label>
          <Input
            id={descEnId}
            value={values.descriptionEn}
            onChange={(e) => patch({ descriptionEn: e.target.value })}
            disabled={disabled}
            placeholder="Заавал биш"
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Ангилал</span>
        <Select
          value={values.section}
          onValueChange={(section) => patch({ section })}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Ангилал сонгох" />
          </SelectTrigger>
          <SelectContent>
            {sectionOptions.map((label) => (
              <SelectItem key={label} value={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Хэмжээ / хэсгийн үнэ</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSizeRow}
            disabled={disabled}
          >
            <Plus className="mr-1 h-4 w-4" />
            Хэмжээ нэмэх
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Нэг хоол олон хэмжээтэй, өөр өөр үнэтэй үед ашиглана. Жишээ: 1 хүний порц, 2
          хүний порц эсвэл 100гр, 200гр. Хэрвээ зөвхөн нэг үнэ ашиглах бол энэ хэсгийг
          бөглөх шаардлагагүй.
        </p>

        {values.sizes.length > 0 ? (
          <div className="hidden gap-2 px-2 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_1fr_100px_auto]">
            <span>Монгол</span>
            <span>English</span>
            <span>Үнэ</span>
            <span className="sr-only">Хасах</span>
          </div>
        ) : null}

        {values.sizes.map((row, index) => (
          <div
            key={index}
            className="grid gap-2 rounded-md border border-dashed p-2 sm:grid-cols-[1fr_1fr_100px_auto]"
          >
            <Input
              placeholder="Монгол утга"
              value={row.labelMn}
              onChange={(e) => updateSizeRow(index, { labelMn: e.target.value })}
              disabled={disabled}
              aria-label="Монгол хэмжээний нэр"
            />
            <Input
              placeholder="English label"
              value={row.labelEn}
              onChange={(e) => updateSizeRow(index, { labelEn: e.target.value })}
              disabled={disabled}
              aria-label="English portion label"
            />
            <Input
              type="number"
              min={0}
              placeholder="Үнэ"
              value={row.price}
              onChange={(e) => updateSizeRow(index, { price: e.target.value })}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => removeSizeRow(index)}
              disabled={disabled}
              aria-label="Хэмжээ хасах"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {!hasSizes ? (
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor={priceId}>
            Үнэ
          </label>
          <Input
            id={priceId}
            type="number"
            min={0}
            step={1}
            value={values.price}
            onChange={(e) => patch({ price: e.target.value })}
            disabled={disabled}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Үндсэн үнэ (хамгийн бага хэмжээ):{" "}
          <span className="font-semibold text-foreground">
            {Number.isFinite(displayPrice) ? displayPrice.toLocaleString() : "—"}
          </span>
        </p>
      )}

      <div className="space-y-2">
        <span className="text-sm font-medium">Халууны түвшин</span>
        <SpicyLevelSelector
          value={values.spicyLevel}
          onChange={(spicyLevel) => patch({ spicyLevel })}
          disabled={disabled}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border"
          checked={values.available}
          onChange={(e) => patch({ available: e.target.checked })}
          disabled={disabled}
        />
        Үйлчлүүлэгчийн цэсэнд харагдах
      </label>
    </div>
  )
}

export function validateMenuItemForm(
  values: MenuItemFormValues,
  mode: MenuItemFormMode
): string | null {
  const trimmedSection = values.section.trim()
  const nameMn = values.nameMn.trim()
  const nameEn = values.nameEn.trim()
  const sizes = sizesFromFormRows(values.sizes)
  const priceNum = Number(values.price)

  if (!nameMn && !nameEn) {
    return "Монгол эсвэл англи нэр оруулна уу"
  }
  if (!trimmedSection) {
    return "Ангилал сонгоно уу"
  }

  if (!sizes?.length) {
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return "Зөв үнэ оруулна уу эсвэл хэмжээ нэмнэ үү"
    }
  } else {
    for (const row of values.sizes) {
      if (!row.labelMn.trim() && !row.labelEn.trim()) {
        return "Хэмжээ бүрт монгол эсвэл англи нэр шаардлагатай"
      }
      const p = Number(row.price)
      if (Number.isNaN(p) || p < 0) {
        return "Хэмжээ бүрт зөв үнэ оруулна уу"
      }
    }
  }

  if (mode === "create" && !values.imageFile) {
    return "Зураг оруулна уу"
  }

  return null
}

export function buildMenuItemFormData(values: MenuItemFormValues): FormData {
  const sizes = sizesFromFormRows(values.sizes)
  const basePrice = sizes?.length
    ? resolveMenuPrice(0, sizes)
    : Number(values.price)

  const formData = new FormData()
  formData.append("nameMn", values.nameMn.trim())
  formData.append("nameEn", values.nameEn.trim())
  formData.append("descriptionMn", values.descriptionMn.trim())
  formData.append("descriptionEn", values.descriptionEn.trim())
  formData.append("price", String(basePrice))
  formData.append("section", values.section.trim())
  formData.append("spicyLevel", String(clampSpicyLevel(values.spicyLevel)))
  formData.append("available", values.available ? "true" : "false")
  formData.append("quantity", "0")
  if (sizes?.length) {
    formData.append("sizesJson", JSON.stringify(sizes))
  }
  if (values.imageFile) formData.append("image", values.imageFile)
  return formData
}

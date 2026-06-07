"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  MenuItemForm,
  menuItemToFormValues,
  validateMenuItemForm,
  type EditableMenuItem,
  type MenuItemFormValues,
} from "./MenuItemForm"
import { deleteApi, patchApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import { IMenu } from "@/types/menu"
import { MENU_ITEM_BY_ID } from "@/utils/APIConstant"
import { buildMenuItemFormData } from "./MenuItemForm"
import { isValidMenuItemId } from "@/utils/menuItemId"

export type { EditableMenuItem } from "./MenuItemForm"

type MenuItemEditModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: EditableMenuItem | null
  sectionOptions: string[]
  onSaved: () => void
  onDeleted: (id: string) => void
}

export function MenuItemEditModal({
  open,
  onOpenChange,
  item,
  sectionOptions,
  onSaved,
  onDeleted,
}: MenuItemEditModalProps) {
  const [values, setValues] = useState<MenuItemFormValues>(() =>
    menuItemToFormValues({
      id: "",
      section: "",
      nameMn: "",
      nameEn: "",
      price: 0,
      image: "",
      spicyLevel: 0,
      available: true,
    })
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!item || !open) return
    setValues(menuItemToFormValues(item))
  }, [item, open])

  const handleSave = async () => {
    if (!item || saving) return

    const validationError = validateMenuItemForm(values, "edit")
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (!isValidMenuItemId(item.id)) {
      toast.error("Хоолны ID буруу байна — хуудсыг дахин ачаална уу")
      return
    }

    try {
      setSaving(true)
      toast.loading("Хоол хадгалж байна...", { id: "edit-menu-item" })

      const res = await patchApi<ApiResponse<IMenu>>({
        url: MENU_ITEM_BY_ID(item.id),
        values: buildMenuItemFormData(values),
      })

      if (!res?.success) {
        throw new Error(res?.message || "Хоол шинэчилж чадсангүй")
      }

      toast.success("Хоол хадгалагдлаа", { id: "edit-menu-item" })
      onOpenChange(false)
      onSaved()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Хоол хадгалж чадсангүй"
      toast.error(message, { id: "edit-menu-item" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!item || deleting) return

    if (
      !window.confirm(
        `"${item.nameMn || item.nameEn}" хоолыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`
      )
    ) {
      return
    }

    if (!isValidMenuItemId(item.id)) {
      toast.error("Хоолны ID буруу байна — хуудсыг дахин ачаална уу")
      return
    }

    try {
      setDeleting(true)
      toast.loading("Хоол устгаж байна...", { id: "delete-menu-item" })

      const res = await deleteApi<ApiResponse<IMenu>>({
        url: MENU_ITEM_BY_ID(item.id),
      })

      if (!res?.success) {
        throw new Error(res?.message || "Хоол устгаж чадсангүй")
      }

      toast.success("Хоол устгагдлаа", { id: "delete-menu-item" })
      onOpenChange(false)
      onDeleted(item.id)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Хоол устгаж чадсангүй"
      toast.error(message, { id: "delete-menu-item" })
    } finally {
      setDeleting(false)
    }
  }

  const busy = saving || deleting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Хоол засах</DialogTitle>
          <DialogDescription>
            Нэр, үнэ, ангилал, зураг, боломжит эсэхийг шинэчилнэ.
          </DialogDescription>
        </DialogHeader>

        <MenuItemForm
          mode="edit"
          idPrefix="edit-menu"
          values={values}
          onChange={setValues}
          sectionOptions={sectionOptions}
          disabled={busy}
        />

        <DialogFooter className="flex-row items-center justify-between gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={busy}
          >
            {deleting ? "Устгаж байна…" : "Устгах"}
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Болих
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy}
              className="bg-black text-white hover:bg-neutral-800"
            >
              {saving ? "Хадгалж байна…" : "Хадгалах"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

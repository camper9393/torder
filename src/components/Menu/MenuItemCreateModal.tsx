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
  buildMenuItemFormData,
  emptyMenuItemFormValues,
  validateMenuItemForm,
  type MenuItemFormValues,
} from "./MenuItemForm"
import { postApi } from "@/utils/common"
import { ApiResponse } from "@/utils/api"
import { IMenu } from "@/types/menu"
import { ADD_MENU_ITEM } from "@/utils/APIConstant"

type MenuItemCreateModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionOptions: string[]
  defaultSection: string
  onCreated: () => void
}

export function MenuItemCreateModal({
  open,
  onOpenChange,
  sectionOptions,
  defaultSection,
  onCreated,
}: MenuItemCreateModalProps) {
  const [values, setValues] = useState<MenuItemFormValues>(() =>
    emptyMenuItemFormValues(defaultSection)
  )
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(emptyMenuItemFormValues(defaultSection))
  }, [open, defaultSection])

  const handleCreate = async () => {
    if (creating) return

    const validationError = validateMenuItemForm(values, "create")
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setCreating(true)
      toast.loading("Хоол үүсгэж байна...", { id: "create-menu-item" })

      const res = await postApi<ApiResponse<IMenu>>({
        url: ADD_MENU_ITEM,
        values: buildMenuItemFormData(values),
      })

      if (!res?.success) {
        throw new Error(res?.message || "Хоол үүсгэж чадсангүй")
      }

      toast.success("Хоол нэмэгдлээ", { id: "create-menu-item" })
      onOpenChange(false)
      onCreated()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Хоол үүсгэж чадсангүй"
      toast.error(message, { id: "create-menu-item" })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Хоол нэмэх</DialogTitle>
          <DialogDescription>
            Доорх мэдээллийг бөглөөд хоол нэмнэ үү.
          </DialogDescription>
        </DialogHeader>

        <MenuItemForm
          mode="create"
          idPrefix="create-menu"
          values={values}
          onChange={setValues}
          sectionOptions={sectionOptions}
          disabled={creating}
        />

        <DialogFooter className="flex-wrap gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Болих
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
          >
            {creating ? "Үүсгэж байна…" : "Мэню нэмэх"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

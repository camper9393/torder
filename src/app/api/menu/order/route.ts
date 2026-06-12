import mongoServer from "@/config/mongoConfig";
import { Permission } from "@/lib/permissions";
import { requirePosScope } from "@/lib/tenant";
import { sendRJResponse } from "@/utils/api";
import {
  getMenuOrderSnapshot,
  MenuSectionConflictError,
  moveMenuOrderItemBetweenSections,
  removeMenuOrderItem,
  removeMenuOrderSection,
  renameMenuOrderSection,
  saveMenuOrderItemOrder,
  saveMenuOrderSectionIcon,
  saveMenuOrderSectionOrder,
  upsertMenuSection,
} from "@/utils/menuOrderStore";
import { isCategoryIconName } from "@/utils/categoryIcons";
import { NextRequest } from "next/server";

function posAuthMessage(res: Response): string {
  return res.status === 403
    ? "Энэ үйлдлийг хийх эрхгүй байна"
    : "Нэвтрэх шаардлагатай";
}

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const scope = await requirePosScope(req, { permission: Permission.MENU });
    if (scope instanceof Response) {
      return sendRJResponse({
        success: false,
        message: posAuthMessage(scope),
        status: scope.status,
      });
    }

    const order = await getMenuOrderSnapshot(scope.merchantId!);

    return sendRJResponse({
      success: true,
      message: "Menu order fetched successfully",
      data: order,
      status: 200,
    });
  } catch (error) {
    console.error("Error while fetching menu order:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

type MenuOrderPatchBody = {
  sectionOrder?: string[];
  sectionIcon?: { section: string; icon: string };
  upsertSection?: {
    key?: string;
    labelMn: string;
    labelEn: string;
    icon: string;
  };
  itemOrder?: { section: string; ids: string[] };
  renameSection?: { from: string; to: string };
  removeSection?: string;
  removeItem?: { section: string; itemId: string };
  moveItem?: { itemId: string; fromSection: string; toSection: string };
};

export async function PATCH(req: NextRequest) {
  try {
    await mongoServer();

    const scope = await requirePosScope(req, { permission: Permission.MENU });
    if (scope instanceof Response) {
      return sendRJResponse({
        success: false,
        message: posAuthMessage(scope),
        status: scope.status,
      });
    }

    const merchantObjectId = scope.merchantId!;
    const body = (await req.json()) as MenuOrderPatchBody;

    if (body.sectionOrder) {
      await saveMenuOrderSectionOrder(
        merchantObjectId,
        body.sectionOrder.filter((v): v is string => typeof v === "string")
      );
    }

    if (body.sectionIcon?.section && body.sectionIcon.icon) {
      if (!isCategoryIconName(body.sectionIcon.icon)) {
        return sendRJResponse({
          success: false,
          message: "Invalid category icon",
          status: 400,
        });
      }
      await saveMenuOrderSectionIcon(
        merchantObjectId,
        body.sectionIcon.section,
        body.sectionIcon.icon
      );
    }

    if (body.upsertSection) {
      const { key, labelMn, labelEn, icon } = body.upsertSection;
      if (!labelMn?.trim()) {
        return sendRJResponse({
          success: false,
          message: "Mongolian category name is required",
          status: 400,
        });
      }
      if (!isCategoryIconName(icon)) {
        return sendRJResponse({
          success: false,
          message: "Invalid category icon",
          status: 400,
        });
      }
      try {
        await upsertMenuSection(merchantObjectId, {
          key: typeof key === "string" ? key : undefined,
          labelMn: labelMn.trim(),
          labelEn: typeof labelEn === "string" ? labelEn.trim() : labelMn.trim(),
          icon,
        });
      } catch (error) {
        if (error instanceof MenuSectionConflictError) {
          return sendRJResponse({
            success: false,
            message: error.message,
            status: 409,
          });
        }
        throw error;
      }
    }

    if (body.itemOrder?.section) {
      await saveMenuOrderItemOrder(
        merchantObjectId,
        body.itemOrder.section,
        Array.isArray(body.itemOrder.ids)
          ? body.itemOrder.ids.filter((v): v is string => typeof v === "string")
          : []
      );
    }

    if (body.renameSection?.from && body.renameSection?.to) {
      await renameMenuOrderSection(
        merchantObjectId,
        body.renameSection.from,
        body.renameSection.to
      );
    }

    if (body.removeSection) {
      await removeMenuOrderSection(merchantObjectId, body.removeSection);
    }

    if (body.removeItem?.section && body.removeItem?.itemId) {
      await removeMenuOrderItem(
        merchantObjectId,
        body.removeItem.section,
        body.removeItem.itemId
      );
    }

    if (
      body.moveItem?.itemId &&
      body.moveItem.fromSection &&
      body.moveItem.toSection
    ) {
      await moveMenuOrderItemBetweenSections(
        merchantObjectId,
        body.moveItem.itemId,
        body.moveItem.fromSection,
        body.moveItem.toSection
      );
    }

    const order = await getMenuOrderSnapshot(merchantObjectId);

    return sendRJResponse({
      success: true,
      message: "Menu order updated successfully",
      data: order,
      status: 200,
    });
  } catch (error) {
    console.error("Error while updating menu order:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

import mongoServer from "@/config/mongoConfig";
import { Permission } from "@/lib/permissions";
import { requirePosScope } from "@/lib/tenant";
import { Menu } from "@/model/menu";
import { sendRJResponse } from "@/utils/api";
import { scopedMerchantMenuQuery } from "@/utils/menuMerchantScope";
import { normalizeMenuDocument } from "@/utils/menuBilingual";
import { applyMenuOrdering } from "@/utils/menuOrder";
import { getMenuOrderSnapshot } from "@/utils/menuOrderStore";
import { MUJIN_MENU_SECTIONS } from "@/data/mujinMenuSeed";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const scope = await requirePosScope(req, { permission: Permission.MENU });    if (scope instanceof Response) {
      return sendRJResponse({        success: false,
        message:
          scope.status === 403
            ? "Энэ үйлдлийг хийх эрхгүй байна"
            : "Нэвтрэх шаардлагатай",
        status: scope.status,
      });
    }

    const merchantObjectId = scope.merchantId!;
    const merchantId = merchantObjectId.toHexString();
    const debug = req.nextUrl.searchParams.get("debug") === "1";

    const rows = await Menu.find(
      scopedMerchantMenuQuery(merchantObjectId, scope.restaurantId)
    ).lean();
    const menu = rows.map((row) => normalizeMenuDocument(row));
    const order = await getMenuOrderSnapshot(merchantObjectId);
    const defaultSectionOrder = [...MUJIN_MENU_SECTIONS];
    const orderedMenu = applyMenuOrdering(
      menu,
      order.sectionOrder,
      order.itemOrders,
      defaultSectionOrder
    );

    const data = debug
      ? {
          menu: orderedMenu,
          merchantId,
          count: orderedMenu.length,
          order,
        }
      : orderedMenu;

    return sendRJResponse({
      success: true,
      message: "Menu fetched successfully",
      data,
      status: 200,
    });
  } catch (error) {
    console.error("Error while fetching menu:", error);

    return sendRJResponse({
      success: false,
      message:
        error instanceof Error ? error.message : "Internal server error",
      status: 500,
    });
  }
}

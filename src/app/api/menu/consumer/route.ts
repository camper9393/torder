import mongoServer from "@/config/mongoConfig";
import { Merchants } from "@/model/merchants";
import { Menu } from "@/model/menu";
import { VisitorModel } from "@/model/visitors";
import { sendRJResponse } from "@/utils/api";
import { normalizeMenuDocument } from "@/utils/menuBilingual";
import { applyMenuOrdering } from "@/utils/menuOrder";
import { getMenuOrderSnapshot } from "@/utils/menuOrderStore";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";
import {
  resolvePosMerchantId,
  resolveTenantScopeFromMerchantId,
} from "@/lib/tenant";
import { scopedMerchantMenuQuery } from "@/utils/menuMerchantScope";

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const merchantParam = req.nextUrl.searchParams.get("merchantId");
    const userId = req.nextUrl.searchParams.get("userId");

    let merchantObjectId: Types.ObjectId | null = null;
    if (
      merchantParam &&
      merchantParam !== "undefined" &&
      merchantParam !== "test" &&
      isValidObjectId(merchantParam)
    ) {
      merchantObjectId = new Types.ObjectId(merchantParam);
    } else {
      merchantObjectId = await resolvePosMerchantId(req);
    }

    if (!merchantObjectId) {
      return sendRJResponse({
        success: false,
        message: "Invalid merchantId",
        data: { menu: [], restaurantName: "Ресторан" },
        status: 400,
      });
    }

    const merchantId = merchantObjectId.toHexString();
    const { restaurantId } = await resolveTenantScopeFromMerchantId(merchantObjectId);

    const menu = await Menu.find(
      scopedMerchantMenuQuery(merchantObjectId, restaurantId)
    ).lean();

    const normalizedMenu = menu
      .filter((item) => item.available !== false)
      .map((item) => normalizeMenuDocument(item));

    const order = await getMenuOrderSnapshot(merchantObjectId);

    const visibleMenu = applyMenuOrdering(
      normalizedMenu,
      order.sectionOrder,
      order.itemOrders
    );

    let restaurantName = "Ресторан";
    const merchant = await Merchants.findById(merchantObjectId)
      .select("name")
      .lean();
    if (merchant?.name) restaurantName = merchant.name;

    if (!userId || !isValidObjectId(userId) || merchantId !== userId) {
      await VisitorModel.create({
        merchantId: merchantObjectId,
        userId: userId && isValidObjectId(userId) ? userId : null,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Menu fetched successfully",
      data: {
        menu: visibleMenu,
        restaurantName,
        sectionIcons: order.sectionIcons,
        sectionMeta: order.sectionMeta,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error while fetching menu:", error);

    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

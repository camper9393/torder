import mongoServer from "@/config/mongoConfig";

import { Order } from "@/model/order";

import { sendRJResponse } from "@/utils/api";

import { mapCheckoutItemToOrderPayload } from "@/utils/orderLineMapping";

import { resolveOrderItemsForPersistence } from "@/utils/orderItemPersistence";

import type { RawOrderItemLike } from "@/utils/orderItemPricing";

import { computeOrderTotal } from "@/utils/orderTotals";

import { normalizeTableName } from "@/utils/table";
import {
  generateOrderNumber,
  isDuplicateKeyError,
} from "@/utils/generateOrderNumber";

import { isValidObjectId, Types } from "mongoose";

import { NextRequest } from "next/server";
import { resolveTenantScopeFromMerchantId } from "@/lib/tenant";
import { withRestaurantId } from "@/utils/tenantQuery";
import { Menu } from "@/model/menu";



export async function POST(req: NextRequest) {

  try {

    await mongoServer();



    const body = await req.json();

    const { merchantId, tableName, items } = body;



    if (!merchantId || !isValidObjectId(merchantId)) {

      return sendRJResponse({

        success: false,

        message: "Valid merchant id is required",

        status: 400,

      });

    }



    const resolvedTableName = normalizeTableName(

      typeof tableName === "string" ? tableName : undefined

    );



    if (!Array.isArray(items) || items.length === 0) {

      return sendRJResponse({

        success: false,

        message: "Order must include at least one item",

        status: 400,

      });

    }



    const merchantObjectId = new Types.ObjectId(merchantId);
    const { restaurantId } = await resolveTenantScopeFromMerchantId(merchantObjectId);

    let mapped: RawOrderItemLike[];

    try {

      mapped = items.map((item: RawOrderItemLike & { _id?: string; itemCount?: number }) =>

        mapCheckoutItemToOrderPayload(

          item as Parameters<typeof mapCheckoutItemToOrderPayload>[0]

        )

      );

    } catch (err) {

      const message =

        err instanceof Error ? err.message : "Invalid item price";

      return sendRJResponse({

        success: false,

        message,

        status: 400,

      });

    }



    let normalized;

    try {

      normalized = await resolveOrderItemsForPersistence(mapped, merchantObjectId);

    } catch (err) {

      const message =

        err instanceof Error ? err.message : "Invalid item price";

      return sendRJResponse({

        success: false,

        message,

        status: 400,

      });

    }



    const dbItems = normalized.map((item) => ({

      menuItemId:

        item.menuItemId && isValidObjectId(item.menuItemId)

          ? new Types.ObjectId(item.menuItemId)

          : undefined,

      title: item.title,

      nameMn: item.nameMn,

      nameEn: item.nameEn,

      selectedSizeLabelMn: item.selectedSizeLabelMn,

      selectedSizeLabelEn: item.selectedSizeLabelEn,

      price: item.price,

      quantity: item.quantity,

      image: item.image,

    }));



    const total = computeOrderTotal(dbItems);

    if (restaurantId) {
      const menuIds = dbItems
        .map((item) => item.menuItemId)
        .filter((id): id is Types.ObjectId => Boolean(id));
      if (menuIds.length > 0) {
        const menuCount = await Menu.countDocuments(
          withRestaurantId(
            { _id: { $in: menuIds }, merchantId: merchantObjectId },
            restaurantId
          )
        );
        if (menuCount !== menuIds.length) {
          return sendRJResponse({
            success: false,
            message: "Зарим бүтээгдэхүүн энэ ресторанд хамаарахгүй байна",
            status: 403,
          });
        }
      }
    }

    if (!Number.isFinite(total) || total < 0) {

      return sendRJResponse({

        success: false,

        message: "Invalid order total",

        status: 400,

      });

    }



    const restaurantObjectId = restaurantId ?? null;

    let order;
    for (let attempt = 0; attempt < 5; attempt++) {
      const orderNo = await generateOrderNumber({
        merchantId: merchantObjectId,
        restaurantId: restaurantObjectId,
      });

      try {
        order = await Order.create({
          merchantId: merchantObjectId,
          restaurantId: restaurantId ?? undefined,
          orderNo,
          tableName: resolvedTableName,
          items: dbItems,
          total,
          status: "new",
        });
        break;
      } catch (createError) {
        if (!isDuplicateKeyError(createError) || attempt === 4) {
          throw createError;
        }
      }
    }

    if (!order) {
      return sendRJResponse({
        success: false,
        message: "Could not create order",
        status: 500,
      });
    }



    return sendRJResponse({

      success: true,

      message: "Order placed successfully",

      data: order,

      status: 201,

    });

  } catch (error) {

    console.error("Error placing order:", error);

    if (error instanceof Error && error.message === "Invalid item price") {

      return sendRJResponse({

        success: false,

        message: error.message,

        status: 400,

      });

    }

    return sendRJResponse({

      success: false,

      message: "Internal server error",

      status: 500,

    });

  }

}



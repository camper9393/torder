import mongoServer from "@/config/mongoConfig";

import { Order } from "@/model/order";

import { sendRJResponse } from "@/utils/api";

import { mapCheckoutItemToOrderPayload } from "@/utils/orderLineMapping";

import { resolveOrderItemsForPersistence } from "@/utils/orderItemPersistence";

import type { RawOrderItemLike } from "@/utils/orderItemPricing";

import { computeOrderTotal } from "@/utils/orderTotals";

import { normalizeTableName } from "@/utils/table";

import { isValidObjectId, Types } from "mongoose";

import { NextRequest } from "next/server";



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



    console.log("ORDER ITEMS BEFORE SAVE", items);



    const merchantObjectId = new Types.ObjectId(merchantId);



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



    if (!Number.isFinite(total) || total < 0) {

      return sendRJResponse({

        success: false,

        message: "Invalid order total",

        status: 400,

      });

    }



    const order = await Order.create({

      merchantId: merchantObjectId,

      tableName: resolvedTableName,

      items: dbItems,

      total,

      status: "new",

    });



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



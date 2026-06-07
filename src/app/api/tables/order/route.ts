import mongoServer from "@/config/mongoConfig";

import { verifyAuth } from "@/middleware/auth";

import { Order } from "@/model/order";

import { sendRJResponse } from "@/utils/api";

import { resolveOrderItemsForPersistence } from "@/utils/orderItemPersistence";

import type { RawOrderItemLike } from "@/utils/orderItemPricing";

import { computeOrderTotal } from "@/utils/orderTotals";

import { serializeKitchenOrder } from "@/utils/serializeKitchenOrder";

import { ACTIVE_TABLE_ORDER_STATUSES } from "@/utils/tableManagement";

import { normalizeTableName } from "@/utils/table";

import { isValidObjectId, Types } from "mongoose";

import { NextRequest, NextResponse } from "next/server";



async function resolveMerchantId(

  req: NextRequest,

  bodyMerchantId?: unknown

): Promise<Types.ObjectId | null> {

  const authResult = await verifyAuth(req);

  if (authResult && !(authResult instanceof NextResponse)) {

    const id = String(authResult);

    if (isValidObjectId(id)) return new Types.ObjectId(id);

  }



  if (typeof bodyMerchantId === "string" && isValidObjectId(bodyMerchantId)) {

    return new Types.ObjectId(bodyMerchantId);

  }



  return null;

}



function toDbOrderItems(

  items: Awaited<ReturnType<typeof resolveOrderItemsForPersistence>>

) {

  return items.map((item) => ({

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

    served: item.served === true,

  }));

}



/** Staff-created order for an empty table (status accepted, not new). */

export async function POST(req: NextRequest) {

  try {

    await mongoServer();



    const body = await req.json();

    const { tableName, items } = body;

    const merchantId = await resolveMerchantId(req, body.merchantId);



    if (!merchantId) {

      return sendRJResponse({

        success: false,

        message: "Unauthorized",

        status: 401,

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



    let normalized;

    try {

      normalized = await resolveOrderItemsForPersistence(

        items as RawOrderItemLike[],

        merchantId

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



    console.log("ORDER ITEMS AFTER PRICE RESOLVE", normalized);



    const dbItems = toDbOrderItems(normalized);

    const total = computeOrderTotal(dbItems);



    if (total <= 0) {

      return sendRJResponse({

        success: false,

        message: "Invalid order total",

        status: 400,

      });

    }



    const existingActive = await Order.findOne({

      merchantId,

      tableName: resolvedTableName,

      status: { $in: ACTIVE_TABLE_ORDER_STATUSES },

    }).lean();



    if (existingActive) {

      return sendRJResponse({

        success: false,

        message: "Table already has an active order",

        status: 409,

      });

    }



    const order = await Order.create({

      merchantId,

      tableName: resolvedTableName,

      items: dbItems,

      total,

      status: "accepted",

    });



    const doc = order.toObject();

    return sendRJResponse({

      success: true,

      message: "Order created",

      data: serializeKitchenOrder({

        ...doc,

        items: doc.items.map(

          (item: {

            menuItemId?: Types.ObjectId;

            title: string;

            nameMn?: string;

            nameEn?: string;

            selectedSizeLabelMn?: string;

            selectedSizeLabelEn?: string;

            price: number;

            quantity: number;

            image?: string;

            served?: boolean;

          }) => ({

            title: item.title,

            nameMn: item.nameMn,

            nameEn: item.nameEn,

            selectedSizeLabelMn: item.selectedSizeLabelMn,

            selectedSizeLabelEn: item.selectedSizeLabelEn,

            price: item.price,

            quantity: item.quantity,

            image: item.image,

            menuItemId: item.menuItemId ? String(item.menuItemId) : undefined,

            served: item.served === true,

          })

        ),

      }),

      status: 201,

    });

  } catch (error) {

    console.error("Error creating manual table order:", error);

    if (

      error instanceof Error &&

      error.message === "Invalid item price"

    ) {

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



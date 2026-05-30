import mongoServer from "@/config/mongoConfig";
import { Order } from "@/model/order";
import { sendRJResponse } from "@/utils/api";
import { normalizeTableName } from "@/utils/table";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await mongoServer();

    const body = await req.json();
    const { merchantId, tableName, items, total } = body;

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

    const parsedTotal = Number(total);
    if (!parsedTotal || parsedTotal <= 0) {
      return sendRJResponse({
        success: false,
        message: "Invalid order total",
        status: 400,
      });
    }

    const orderItems = items.map(
      (item: {
        _id?: string;
        title: string;
        price: number;
        itemCount?: number;
        quantity?: number;
        image?: string;
      }) => ({
        menuItemId: item._id && isValidObjectId(item._id) ? item._id : undefined,
        title: item.title,
        price: Number(item.price),
        quantity: Number(item.itemCount ?? item.quantity ?? 1),
        image: item.image,
      })
    );

    const order = await Order.create({
      merchantId: new Types.ObjectId(merchantId),
      tableName: resolvedTableName,
      items: orderItems,
      total: parsedTotal,
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
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

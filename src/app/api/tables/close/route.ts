import mongoServer from "@/config/mongoConfig";
import { verifyAuth } from "@/middleware/auth";
import { Order, type IOrder } from "@/model/order";
import { sendRJResponse } from "@/utils/api";
import { deductInventoryForOrder } from "@/utils/inventoryDeduction";
import { ACTIVE_TABLE_ORDER_STATUSES } from "@/utils/tableManagement";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { scopedMerchantQuery } from "@/utils/tenantQuery";

export async function POST(req: NextRequest) {
  try {
    await mongoServer();

    const body = await req.json();
    const { tableName, merchantId } = body;

    if (!tableName || typeof tableName !== "string") {
      return sendRJResponse({
        success: false,
        message: "Table name is required",
        status: 400,
      });
    }

    let filter: Record<string, unknown> = {
      tableName: tableName.trim(),
      status: { $in: ACTIVE_TABLE_ORDER_STATUSES },
    };

    if (merchantId && isValidObjectId(merchantId)) {
      filter = {
        ...filter,
        ...(await scopedMerchantQuery(new Types.ObjectId(merchantId))),
      };
    }

    const orders = await Order.find(filter).lean<IOrder[]>();

    console.info("[inventory] Table close / payment flow started", {
      tableName: tableName.trim(),
      orderCount: orders.length,
      orderIds: orders.map((o) => String(o._id)),
    });

    let authMerchantId: Types.ObjectId | undefined;
    const authResult = await verifyAuth(req);
    if (authResult && !(authResult instanceof NextResponse)) {
      const id = String(authResult);
      if (isValidObjectId(id)) {
        authMerchantId = new Types.ObjectId(id);
      }
    }

    for (const order of orders) {
      console.info("[inventory] Table close — deducting order items", {
        orderId: String(order._id),
        status: order.status,
        items: order.items.map((item) => ({
          title: item.title,
          menuItemId: item.menuItemId ? String(item.menuItemId) : null,
          quantity: item.quantity,
        })),
      });

      try {
        await deductInventoryForOrder(
          order,
          authMerchantId ?? (order.merchantId as Types.ObjectId)
        );
      } catch (deductErr) {
        console.error("[inventory] Deduction failed on table close", {
          orderId: String(order._id),
          error: deductErr,
        });
      }
    }

    const paymentMethod =
      typeof body.paymentMethod === "string" && body.paymentMethod.trim()
        ? body.paymentMethod.trim()
        : "Бэлэн";

    for (const order of orders) {
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            status: "closed",
            paidAmount: order.paidAmount ?? order.total,
            paymentMethod: order.paymentMethod ?? paymentMethod,
          },
        }
      );
    }

    const result = { modifiedCount: orders.length };

    return sendRJResponse({
      success: true,
      message: "Table closed",
      data: { modifiedCount: result.modifiedCount },
      status: 200,
    });
  } catch (error) {
    console.error("Error closing table:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

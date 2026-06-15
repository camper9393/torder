import mongoServer from "@/config/mongoConfig";
import { Order, type IOrder } from "@/model/order";
import { sendRJResponse } from "@/utils/api";
import { ACTIVE_TABLE_ORDER_STATUSES } from "@/utils/tableManagement";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";
import { scopedMerchantQuery } from "@/utils/tenantQuery";

function parseNonNegativeNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

export async function POST(req: NextRequest) {
  try {
    await mongoServer();

    const body = await req.json();
    const tableName =
      typeof body.tableName === "string" ? body.tableName.trim() : "";
    const merchantId =
      typeof body.merchantId === "string" ? body.merchantId.trim() : "";

    if (!tableName) {
      return sendRJResponse({
        success: false,
        message: "Table name is required",
        status: 400,
      });
    }

    let filter: Record<string, unknown> = {
      tableName,
      status: { $in: ACTIVE_TABLE_ORDER_STATUSES },
    };

    if (merchantId && isValidObjectId(merchantId)) {
      filter = {
        ...filter,
        ...(await scopedMerchantQuery(new Types.ObjectId(merchantId))),
      };
    }

    const orders = await Order.find(filter).lean<IOrder[]>();

    if (orders.length === 0) {
      return sendRJResponse({
        success: false,
        message: "Идэвхтэй захиалга олдсонгүй",
        status: 404,
      });
    }

    const paymentMethod =
      typeof body.paymentMethod === "string" && body.paymentMethod.trim()
        ? body.paymentMethod.trim()
        : "Бэлэн";

    const vatType =
      typeof body.vatType === "string" && body.vatType.trim()
        ? body.vatType.trim()
        : "НӨАТ-гүй";

    const guestCountRaw = parseNonNegativeNumber(body.guestCount);
    const guestCount =
      guestCountRaw != null && guestCountRaw >= 1
        ? Math.floor(guestCountRaw)
        : undefined;

    const totalOriginal = orders.reduce((sum, order) => sum + order.total, 0);
    const discountRaw = parseNonNegativeNumber(body.discountAmount) ?? 0;
    const discountAmount = Math.min(Math.round(discountRaw), totalOriginal);
    const amountDue = totalOriginal - discountAmount;

    const paidRaw = parseNonNegativeNumber(body.paidAmount);
    const paidAmount =
      paidRaw != null ? Math.round(paidRaw) : Math.round(amountDue);

    if (paidAmount < amountDue) {
      return sendRJResponse({
        success: false,
        message: "Төлсөн дүн хүрэлцэхгүй байна",
        status: 400,
      });
    }

    const changeRaw = parseNonNegativeNumber(body.changeAmount);
    const changeAmount =
      changeRaw != null
        ? Math.round(changeRaw)
        : Math.max(0, paidAmount - amountDue);

    const paidAt = new Date();
    const lastOrderId = String(orders[orders.length - 1]._id);

    for (const order of orders) {
      const share =
        totalOriginal > 0 ? order.total / totalOriginal : 1 / orders.length;
      const orderDiscount = Math.round(discountAmount * share);
      const orderPaid = Math.round(amountDue * share);
      const isLast = String(order._id) === lastOrderId;

      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentMethod,
            vatType,
            ...(guestCount != null ? { guestCount } : {}),
            discountAmount: orderDiscount,
            paidAmount: orderPaid,
            changeAmount: isLast ? changeAmount : 0,
            paidAt,
          },
        }
      );
    }

    return sendRJResponse({
      success: true,
      message: "Төлбөр амжилттай бүртгэгдлээ",
      data: {
        modifiedCount: orders.length,
        subtotal: totalOriginal,
        discountAmount,
        amountDue,
        paidAmount,
        changeAmount,
        paymentMethod,
        vatType,
        guestCount,
        paidAt: paidAt.toISOString(),
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error recording table payment:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

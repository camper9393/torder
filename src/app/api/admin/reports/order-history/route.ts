import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Order, type OrderStatus } from "@/model/order";
import { sendRJResponse } from "@/utils/api";
import { COMPLETED_ORDER_STATUSES } from "@/utils/reports/aggregations";
import {
  resolveReportDateRange,
  validateCustomReportRange,
} from "@/utils/reports/dateRange";
import {
  formatOrderNumber,
  serializeKitchenOrder,
} from "@/utils/serializeKitchenOrder";
import { NextRequest } from "next/server";
import { Types } from "mongoose";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    await mongoServer();
    const merchantId = await resolveMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const params = req.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(params.get("limit") || 20)));
    const search = (params.get("search") || "").trim();
    const table = (params.get("table") || "").trim();
    const status = (params.get("status") || "").trim();
    const orderId = (params.get("orderId") || "").trim();
    const isDetailLookup =
      Boolean(orderId) && Types.ObjectId.isValid(orderId);

    if (!isDetailLookup) {
      const rangeError = validateCustomReportRange(
        params.get("preset"),
        params.get("from"),
        params.get("to")
      );
      if (rangeError) {
        return sendRJResponse({
          success: false,
          message: rangeError,
          status: 400,
        });
      }
    }

    const range = resolveReportDateRange(
      params.get("preset") || "last30",
      params.get("from"),
      params.get("to")
    );

    const query: Record<string, unknown> = {
      merchantId,
      status: { $in: [...COMPLETED_ORDER_STATUSES] },
    };

    if (!isDetailLookup) {
      query.updatedAt = { $gte: range.start, $lte: range.end };
    }

    if (table && table !== "all") {
      query.tableName = table;
    }

    if (status && status !== "all") {
      query.status = status as OrderStatus;
    }

    if (isDetailLookup) {
      query._id = new Types.ObjectId(orderId);
    } else if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [{ tableName: regex }, { "items.title": regex }];
      if (Types.ObjectId.isValid(search)) {
        (query.$or as Record<string, unknown>[]).push({
          _id: new Types.ObjectId(search),
        });
      }
      (query.$or as Record<string, unknown>[]).push({ orderNo: regex });
      if (/^\d{12}$/.test(search)) {
        (query.$or as Record<string, unknown>[]).push({ orderNo: search });
      }
    }

    const [total, orders, tablesAgg] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.distinct("tableName", {
        merchantId,
        status: { $in: [...COMPLETED_ORDER_STATUSES] },
      }),
    ]);

    if (isDetailLookup && orders.length === 1) {
      const doc = orders[0];
      const serialized = serializeKitchenOrder(doc);
      const paid = serialized.paidAmount ?? serialized.total;
      const refunded = serialized.refundedAmount ?? 0;
      return sendRJResponse({
        success: true,
        message: "Order detail fetched",
        data: {
          detail: {
            ...serialized,
            orderNumber: formatOrderNumber({
              _id: serialized._id,
              orderNo: serialized.orderNo,
            }),
            itemsCount: serialized.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            taxAmount: 0,
            netTotal: paid - refunded,
          },
        },
        status: 200,
      });
    }

    const rows = orders.map((doc) => {
      const paid = doc.paidAmount ?? doc.total;
      const refunded = doc.refundedAmount ?? 0;
      const closed = doc.paidAt ? new Date(doc.paidAt) : new Date(doc.updatedAt);
      return {
        _id: String(doc._id),
        orderNumber: formatOrderNumber({
          _id: String(doc._id),
          orderNo: typeof doc.orderNo === "string" ? doc.orderNo : undefined,
        }),
        tableName: doc.tableName,
        date: closed.toISOString().slice(0, 10),
        time: closed.toLocaleTimeString("mn-MN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt:
          doc.createdAt instanceof Date
            ? doc.createdAt.toISOString()
            : new Date(doc.createdAt).toISOString(),
        closedAt: closed.toISOString(),
        itemsCount: doc.items.reduce(
          (sum: number, item: { quantity: number }) => sum + item.quantity,
          0
        ),
        grossTotal: doc.total,
        total: paid,
        discountAmount: doc.discountAmount ?? 0,
        paidAmount: paid,
        netTotal: paid - refunded,
        paymentMethod:
          typeof doc.paymentMethod === "string" ? doc.paymentMethod : undefined,
        vatType: typeof doc.vatType === "string" ? doc.vatType : undefined,
        status: doc.status,
        refundStatus: doc.refundStatus ?? "none",
      };
    });

    if (isDetailLookup && orders.length === 0) {
      return sendRJResponse({
        success: false,
        message: "Захиалга олдсонгүй",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Order history fetched",
      data: {
        orders: rows,
        tables: tablesAgg.sort(),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      status: 200,
    });
  } catch (error) {
    console.error("Order history report error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

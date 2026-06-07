import mongoServer from "@/config/mongoConfig";
import { Order, OrderStatus, type IOrder, type IOrderItem } from "@/model/order";
import type { KitchenOrder } from "@/types/kitchenOrder";
import { sendRJResponse } from "@/utils/api";
import { resolveOrderItemsForPersistence } from "@/utils/orderItemPersistence";
import type { RawOrderItemLike } from "@/utils/orderItemPricing";
import { computeOrderTotal } from "@/utils/orderTotals";
import { serializeKitchenOrder } from "@/utils/serializeKitchenOrder";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";

const ACTIVE_STATUSES: OrderStatus[] = ["new", "accepted", "cooking"];

/** Lean DB items → API shape (ObjectId menuItemId as string, served boolean). */
function mapOrderItemsForKitchenApi(
  items: IOrderItem[]
): KitchenOrder["items"] {
  return items.map((item) => ({
    ...item,
    menuItemId: item.menuItemId ? String(item.menuItemId) : undefined,
    served: item.served === true,
  }));
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

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const merchantId = req.nextUrl.searchParams.get("merchantId");
    const query: Record<string, unknown> = {
      status: { $in: ACTIVE_STATUSES },
    };

    if (merchantId && isValidObjectId(merchantId)) {
      query.merchantId = new Types.ObjectId(merchantId);
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean<IOrder[]>();

    return sendRJResponse({
      success: true,
      message: "Kitchen orders fetched",
      data: orders.map((o) =>
        serializeKitchenOrder({
          ...o,
          items: mapOrderItemsForKitchenApi(o.items),
        })
      ),
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching kitchen orders:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await mongoServer();

    const body = await req.json();
    const { orderId, status, items, itemIndex, served } = body;

    if (!orderId || !isValidObjectId(orderId)) {
      return sendRJResponse({
        success: false,
        message: "Valid order id is required",
        status: 400,
      });
    }

    const existing = await Order.findById(orderId).lean<IOrder>();
    if (!existing) {
      return sendRJResponse({
        success: false,
        message: "Order not found",
        status: 404,
      });
    }

    const update: Record<string, unknown> = {};

    if (itemIndex !== undefined && served !== undefined) {
      const idx = Math.floor(Number(itemIndex));
      if (!Number.isFinite(idx) || idx < 0 || idx >= existing.items.length) {
        return sendRJResponse({
          success: false,
          message: "Invalid item index",
          status: 400,
        });
      }

      const servedFlag = Boolean(served);
      update.items = existing.items.map((item, i) => {
        if (i !== idx) return item;
        return { ...item, served: servedFlag };
      });
    }

    if (status !== undefined) {
      const allowed: OrderStatus[] = ["new", "accepted", "cooking", "done"];
      if (!allowed.includes(status)) {
        return sendRJResponse({
          success: false,
          message: "Invalid status",
          status: 400,
        });
      }
      update.status = status;
    }

    if (items !== undefined) {
      if (!Array.isArray(items) || items.length === 0) {
        return sendRJResponse({
          success: false,
          message: "Order must include at least one item",
          status: 400,
        });
      }

      console.log("ORDER ITEMS BEFORE SAVE", items);

      try {
        const normalized = await resolveOrderItemsForPersistence(
          items as RawOrderItemLike[],
          existing.merchantId as Types.ObjectId
        );
        const dbItems = toDbOrderItems(normalized);
        update.items = dbItems;
        update.total = computeOrderTotal(dbItems);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Invalid item price";
        return sendRJResponse({
          success: false,
          message,
          status: 400,
        });
      }
    }

    if (Object.keys(update).length === 0) {
      return sendRJResponse({
        success: false,
        message: "No updates provided",
        status: 400,
      });
    }

    if (
      items !== undefined &&
      itemIndex === undefined &&
      !["new", "accepted"].includes(existing.status)
    ) {
      return sendRJResponse({
        success: false,
        message: "Cannot edit items after cooking has started",
        status: 400,
      });
    }

    const order = await Order.findByIdAndUpdate(orderId, update, {
      new: true,
    }).lean<IOrder>();

    if (!order) {
      return sendRJResponse({
        success: false,
        message: "Order not found",
        status: 404,
      });
    }

    return sendRJResponse({
      success: true,
      message: "Order updated",
      data: serializeKitchenOrder({
        ...order,
        items: mapOrderItemsForKitchenApi(order.items),
      }),
      status: 200,
    });
  } catch (error) {
    console.error("Error updating kitchen order:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

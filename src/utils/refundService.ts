import { Order, type IOrder, type IRefundedLineItem, type RefundStatus } from "@/model/order";
import { Refund, type IRefundItem, type RefundReason, type RefundType } from "@/model/refund";
import { Merchants } from "@/model/merchants";
import { returnInventoryForRefundLine } from "@/utils/inventoryDeduction";
import { formatOrderNumber } from "@/utils/serializeKitchenOrder";
import type {
  CreateRefundPayload,
  RefundEligibility,
  RefundEligibilityLine,
  RefundLineInput,
} from "@/types/refund";
import { Types } from "mongoose";

const REFUNDABLE_STATUSES = new Set(["done", "closed"]);
const DEFAULT_PAYMENT_METHOD = "Бэлэн";

export class RefundValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RefundValidationError";
  }
}

function refundedQtyMap(order: IOrder): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of order.refundedItems ?? []) {
    map.set(
      row.lineIndex,
      (map.get(row.lineIndex) ?? 0) + row.quantityRefunded
    );
  }
  return map;
}

function mergeRefundedItems(
  existing: IRefundedLineItem[],
  additions: IRefundedLineItem[]
): IRefundedLineItem[] {
  const byLine = new Map<number, IRefundedLineItem>();

  for (const row of existing) {
    byLine.set(row.lineIndex, { ...row });
  }

  for (const row of additions) {
    const prev = byLine.get(row.lineIndex);
    if (!prev) {
      byLine.set(row.lineIndex, { ...row });
      continue;
    }
    prev.quantityRefunded += row.quantityRefunded;
    prev.amountRefunded += row.amountRefunded;
  }

  return [...byLine.values()].sort((a, b) => a.lineIndex - b.lineIndex);
}

/** Optimistic lock: legacy orders may omit refund fields entirely. */
function buildRefundedAmountLock(
  previousRefundedAmount: number
): Record<string, unknown> {
  if (previousRefundedAmount === 0) {
    return {
      $or: [
        { refundedAmount: 0 },
        { refundedAmount: null },
        { refundedAmount: { $exists: false } },
      ],
    };
  }
  return { refundedAmount: previousRefundedAmount };
}

function computeRefundStatus(
  order: IOrder,
  newRefundedAmount: number
): RefundStatus {
  const paid = order.paidAmount ?? order.total;
  if (newRefundedAmount <= 0) return "none";
  if (newRefundedAmount >= paid) return "full";
  return "partial";
}

export async function getRefundEligibility(
  merchantId: Types.ObjectId,
  orderId: string
): Promise<RefundEligibility | null> {
  if (!Types.ObjectId.isValid(orderId)) return null;

  const order = await Order.findOne({
    _id: new Types.ObjectId(orderId),
    merchantId,
  }).lean<IOrder>();

  if (!order) return null;

  const paidAmount = order.paidAmount ?? order.total;
  const refundedAmount = order.refundedAmount ?? 0;
  const refundedMap = refundedQtyMap(order);
  const canRefund =
    REFUNDABLE_STATUSES.has(order.status) && refundedAmount < paidAmount;

  const lines: RefundEligibilityLine[] = order.items.map((item, lineIndex) => {
    const refundedQuantity = refundedMap.get(lineIndex) ?? 0;
    const orderedQuantity = item.quantity;
    const refundableQuantity = Math.max(0, orderedQuantity - refundedQuantity);

    return {
      lineIndex,
      title: item.title,
      unitPrice: item.price,
      orderedQuantity,
      refundedQuantity,
      refundableQuantity,
      defaultReturnToInventory: false,
    };
  });

  return {
    orderId: String(order._id),
    orderNumber: formatOrderNumber(String(order._id)),
    tableName: order.tableName,
    paidAmount,
    paymentMethod: order.paymentMethod ?? DEFAULT_PAYMENT_METHOD,
    refundStatus: order.refundStatus ?? "none",
    refundedAmount,
    netAmount: paidAmount - refundedAmount,
    lines,
    canRefund,
  };
}

function validateRefundLines(
  order: IOrder,
  items: RefundLineInput[]
): IRefundItem[] {
  if (!REFUNDABLE_STATUSES.has(order.status)) {
    throw new RefundValidationError(
      "Зөвхөн дууссан эсвэл төлөгдсөн захиалгыг буцаах боломжтой"
    );
  }

  const paidAmount = order.paidAmount ?? order.total;
  const alreadyRefunded = order.refundedAmount ?? 0;
  const remainingMoney = paidAmount - alreadyRefunded;

  if (remainingMoney <= 0) {
    throw new RefundValidationError("Энэ захиалга бүрэн буцаагдсан байна");
  }

  if (!items.length) {
    throw new RefundValidationError("Буцаах бараа сонгоно уу");
  }

  const refundedMap = refundedQtyMap(order);
  const refundItems: IRefundItem[] = [];
  let totalRefund = 0;

  for (const input of items) {
    const line = order.items[input.lineIndex];
    if (!line) {
      throw new RefundValidationError(`Мөр олдсонгүй: ${input.lineIndex}`);
    }

    const qty = Math.floor(Number(input.quantity));
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new RefundValidationError(`Буруу тоо хэмжээ: ${line.title}`);
    }

    const alreadyQty = refundedMap.get(input.lineIndex) ?? 0;
    const maxQty = line.quantity - alreadyQty;

    if (qty > maxQty) {
      throw new RefundValidationError(
        `"${line.title}"-ийн буцаах боломжтой тоо ${maxQty} (та ${qty} оруулсан)`
      );
    }

    const amount = line.price * qty;
    totalRefund += amount;

    refundItems.push({
      lineIndex: input.lineIndex,
      menuItemId: line.menuItemId,
      title: line.title,
      quantity: qty,
      unitPrice: line.price,
      amount,
      returnToInventory: Boolean(input.returnToInventory),
    });
  }

  if (totalRefund > remainingMoney + 0.001) {
    throw new RefundValidationError(
      `Буцаах дүн (${totalRefund}) төлсөн үлдэгдлээс (${remainingMoney}) их байна`
    );
  }

  return refundItems;
}

export async function processRefund(
  merchantId: Types.ObjectId,
  userId: Types.ObjectId,
  payload: CreateRefundPayload
): Promise<{ refundId: string; refundAmount: number; refundStatus: RefundStatus }> {
  if (!Types.ObjectId.isValid(payload.orderId)) {
    throw new RefundValidationError("Захиалгын ID буруу байна");
  }

  const validReasons: RefundReason[] = [
    "customer_cancelled",
    "wrong_item",
    "item_unavailable",
    "quality_issue",
    "staff_mistake",
    "other",
  ];

  if (!validReasons.includes(payload.reason)) {
    throw new RefundValidationError("Буцаалтын шалтгаан сонгоно уу");
  }

  const order = await Order.findOne({
    _id: new Types.ObjectId(payload.orderId),
    merchantId,
  });

  if (!order) {
    throw new RefundValidationError("Захиалга олдсонгүй");
  }

  const refundItems = validateRefundLines(order, payload.items);
  const refundAmount = refundItems.reduce((sum, row) => sum + row.amount, 0);
  const expectedRefundedAmount = (order.refundedAmount ?? 0) + refundAmount;
  const paidAmount = order.paidAmount ?? order.total;

  const refundId = new Types.ObjectId();
  const inventoryLines = refundItems.filter((row) => row.returnToInventory);

  const merchant = await Merchants.findById(userId).select("name").lean();
  const paymentMethod =
    payload.paymentMethod?.trim() ||
    order.paymentMethod ||
    DEFAULT_PAYMENT_METHOD;

  const newRefundedItems = mergeRefundedItems(
    order.refundedItems ?? [],
    refundItems.map((row) => ({
      lineIndex: row.lineIndex,
      menuItemId: row.menuItemId,
      title: row.title,
      quantityRefunded: row.quantity,
      amountRefunded: row.amount,
    }))
  );

  const newRefundStatus = computeRefundStatus(order, expectedRefundedAmount);
  const previousRefundedAmount = order.refundedAmount ?? 0;
  const previousRefundedItems = order.refundedItems ?? [];
  const previousRefundStatus = order.refundStatus ?? "none";

  const updated = await Order.findOneAndUpdate(
    {
      _id: order._id,
      merchantId,
      ...buildRefundedAmountLock(previousRefundedAmount),
    },
    {
      $set: {
        refundedAmount: expectedRefundedAmount,
        refundedItems: newRefundedItems,
        refundStatus: newRefundStatus,
        paymentMethod: order.paymentMethod ?? paymentMethod,
        paidAmount: order.paidAmount ?? order.total,
      },
    },
    { new: true }
  );

  if (!updated) {
    const exists = await Order.exists({ _id: order._id, merchantId });
    if (!exists) {
      throw new RefundValidationError("Захиалга олдсонгүй");
    }
    throw new RefundValidationError(
      "Захиалга шинэчлэх амжилтгүй — давхар буцаалт эсвэл өөрчлөлт орсон байж болзошгүй. Дахин оролдоно уу."
    );
  }

  try {
    for (const row of inventoryLines) {
      await returnInventoryForRefundLine(
        updated.toObject() as IOrder,
        row.lineIndex,
        row.quantity,
        refundId,
        userId
      );
    }
  } catch (inventoryErr) {
    await Order.findOneAndUpdate(
      { _id: order._id, merchantId },
      {
        $set: {
          refundedAmount: previousRefundedAmount,
          refundedItems: previousRefundedItems,
          refundStatus: previousRefundStatus,
        },
      }
    );
    const message =
      inventoryErr instanceof Error
        ? inventoryErr.message
        : "Агуулахын үлдэгдэл буцаах амжилтгүй";
    throw new RefundValidationError(message);
  }

  const refundDoc = await Refund.create({
    _id: refundId,
    merchantId,
    orderId: order._id,
    tableName: order.tableName,
    items: refundItems,
    refundAmount,
    reason: payload.reason,
    refundType: payload.refundType,
    paymentMethod,
    createdBy: userId,
    createdByName: merchant?.name,
  });

  return {
    refundId: String(refundDoc._id),
    refundAmount,
    refundStatus: newRefundStatus,
  };
}

export function buildFullRefundLines(order: IOrder): RefundLineInput[] {
  const refundedMap = refundedQtyMap(order);
  const lines: RefundLineInput[] = [];

  order.items.forEach((item, lineIndex) => {
    const already = refundedMap.get(lineIndex) ?? 0;
    const qty = item.quantity - already;
    if (qty > 0) {
      lines.push({
        lineIndex,
        quantity: qty,
        returnToInventory: false,
      });
    }
  });

  return lines;
}

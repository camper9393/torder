import { Order } from "@/model/order";
import { Types } from "mongoose";

import {
  DEFAULT_ORDER_TIMEZONE,
  formatOrderMinutePrefix,
} from "@/utils/orderNumberDisplay";

const ORDER_NO_LENGTH = 12;
const MAX_SEQUENCE_PER_MINUTE = 99;

export type OrderNumberScope = {
  merchantId: Types.ObjectId;
  restaurantId?: Types.ObjectId | null;
  timeZone?: string;
};

function buildScopeFilter(scope: OrderNumberScope): Record<string, unknown> {
  if (scope.restaurantId) {
    return { restaurantId: scope.restaurantId };
  }
  return { merchantId: scope.merchantId };
}

/**
 * YYMMDDHHmm + 2 оронт sequence (минут бүр reset).
 * Ижил минутанд олон захиалга үүсэхэд давхцахгүй.
 */
export async function generateOrderNumber(
  scope: OrderNumberScope
): Promise<string> {
  const timeZone = scope.timeZone ?? DEFAULT_ORDER_TIMEZONE;
  const prefix = formatOrderMinutePrefix(new Date(), timeZone);
  const scopeFilter = buildScopeFilter(scope);

  for (let attempt = 0; attempt < 15; attempt++) {
    const latest = await Order.findOne({
      ...scopeFilter,
      orderNo: { $regex: `^${prefix}\\d{2}$` },
    })
      .sort({ orderNo: -1 })
      .select("orderNo")
      .lean();

    let sequence = 1;
    if (latest?.orderNo && latest.orderNo.length === ORDER_NO_LENGTH) {
      const tail = Number.parseInt(latest.orderNo.slice(-2), 10);
      if (Number.isFinite(tail)) {
        sequence = tail + 1;
      }
    }

    if (sequence > MAX_SEQUENCE_PER_MINUTE) {
      throw new Error("ORDER_NUMBER_SEQUENCE_EXHAUSTED");
    }

    const orderNo = `${prefix}${String(sequence).padStart(2, "0")}`;
    const exists = await Order.exists({ ...scopeFilter, orderNo });
    if (!exists) {
      return orderNo;
    }
  }

  throw new Error("ORDER_NUMBER_GENERATION_FAILED");
}

export {
  DEFAULT_ORDER_TIMEZONE,
  formatOrderMinutePrefix,
  isDuplicateKeyError,
  resolveOrderDisplayNumber,
} from "@/utils/orderNumberDisplay";

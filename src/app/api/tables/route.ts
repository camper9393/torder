import mongoServer from "@/config/mongoConfig";
import { resolvePosMerchantId } from "@/lib/tenant";
import { Order, OrderStatus } from "@/model/order";
import { MQR } from "@/model/qrs";
import { TableLayout } from "@/model/tableLayout";
import { WaiterCall } from "@/model/waiterCall";
import type { FloorLayoutTable } from "@/types/floorLayout";
import { layoutDocToFloorTable, mergeFloorLayouts } from "@/utils/floorLayout";
import { ensureMerchantHalls } from "@/utils/tableHallStore";
import { sendRJResponse } from "@/utils/api";
import { UNKNOWN_TABLE } from "@/utils/table";
import {
  ACTIVE_TABLE_ORDER_STATUSES,
  deriveTableDisplayStatus,
  mergeTableNameList,
} from "@/utils/tableManagement";
import { normalizeTableNameKey } from "@/utils/tableNameValidation";
import {
  ACTIVE_WAITER_CALL_STATUSES,
  waiterCallTableKey,
} from "@/utils/waiterCallTable";
import { isValidObjectId, Types } from "mongoose";
import { NextRequest } from "next/server";
import { resolveRestaurantIdForMerchant } from "@/lib/tenant";

const ACTIVE_ORDER_SELECT =
  "tableName status total createdAt restaurantId orderNo items.title items.nameMn items.nameEn items.selectedSizeLabelMn items.selectedSizeLabelEn items.menuItemId items.price items.quantity items.served items.image";

/** Merchant token, platform owner legacy scope, or ?merchantId= query. */
async function resolveTablesMerchantId(
  req: NextRequest
): Promise<Types.ObjectId | null> {
  return resolvePosMerchantId(req);
}

function sumItemCount(
  orders: { items: { quantity: number }[] }[]
): number {
  return orders.reduce(
    (sum, order) =>
      sum + order.items.reduce((s, item) => s + item.quantity, 0),
    0
  );
}

function serializeOrder(doc: {
  _id: unknown;
  merchantId?: unknown;
  restaurantId?: unknown;
  orderNo?: string;
  tableName: string;
  items: unknown[];
  total: number;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}) {
  return {
    _id: String(doc._id),
    merchantId: doc.merchantId ? String(doc.merchantId) : undefined,
    restaurantId: doc.restaurantId ? String(doc.restaurantId) : undefined,
    orderNo: doc.orderNo?.trim() || undefined,
    tableName: doc.tableName,
    items: (doc.items as { served?: boolean }[]).map((item) => ({
      ...(item as Record<string, unknown>),
      served: item.served === true,
    })),
    total: doc.total,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

const MAX_PENDING_PREVIEW = 4;
const MAX_SERVED_PREVIEW = 3;

function buildItemPreview(
  orders: {
    _id: unknown;
    items: { title: string; quantity: number; served?: boolean }[];
  }[]
) {
  const pending: {
    title: string;
    quantity: number;
    served: boolean;
    orderId: string;
    itemIndex: number;
  }[] = [];
  const served: typeof pending = [];

  for (const order of orders) {
    const orderId = String(order._id);
    order.items.forEach((item, itemIndex) => {
      const line = {
        title: item.title,
        quantity: item.quantity,
        served: item.served === true,
        orderId,
        itemIndex,
      };
      if (line.served) served.push(line);
      else pending.push(line);
    });
  }

  const pendingQuantityCount = pending.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return {
    pendingPreviewItems: pending.slice(0, MAX_PENDING_PREVIEW),
    servedPreviewItems: served.slice(0, MAX_SERVED_PREVIEW),
    morePendingCount: Math.max(0, pending.length - MAX_PENDING_PREVIEW),
    moreServedCount: Math.max(0, served.length - MAX_SERVED_PREVIEW),
    pendingQuantityCount,
    previewItems: pending.slice(0, 3),
    morePreviewCount: Math.max(0, pending.length - 3),
  };
}

type ActiveOrderLean = {
  _id: unknown;
  tableName: string;
  status: OrderStatus | string;
  total: number;
  items: { title: string; quantity: number; served?: boolean }[];
  createdAt: Date;
  paymentStatus?: string;
};

function orderIsWaiterCalled(order: ActiveOrderLean): boolean {
  return String(order.status) === "waiter_called";
}

function orderIsPaid(order: ActiveOrderLean): boolean {
  if (String(order.status) === "paid") return true;
  const ps = order.paymentStatus?.toLowerCase();
  return ps === "paid";
}

function buildTableSummary(
  name: string,
  orders: ActiveOrderLean[],
  latestOrderTimeByTable: Map<string, Date>,
  waiterCall?: { id: string }
) {
  const statuses: OrderStatus[] = orders.map((o) => o.status as OrderStatus);
  const totalAmount = orders.reduce((sum, o) => sum + o.total, 0);

  const latestOrderTime =
    orders.length > 0
      ? orders[0].createdAt.toISOString()
      : (latestOrderTimeByTable.get(name)?.toISOString() ?? null);

  const preview = buildItemPreview(orders);

  return {
    tableName: name,
    status: deriveTableDisplayStatus(statuses),
    activeOrderCount: orders.length,
    itemCount: sumItemCount(orders),
    totalAmount,
    latestOrderTime,
    previewItems: preview.previewItems,
    morePreviewCount: preview.morePreviewCount,
    pendingPreviewItems: preview.pendingPreviewItems,
    servedPreviewItems: preview.servedPreviewItems,
    morePendingCount: preview.morePendingCount,
    moreServedCount: preview.moreServedCount,
    pendingQuantityCount: preview.pendingQuantityCount,
    newOrderIds: orders
      .filter((o) => o.status === "new")
      .map((o) => String(o._id)),
    waiterCalled: Boolean(waiterCall),
    waiterCallId: waiterCall?.id,
    hasWaiterCalledOrder: orders.some(orderIsWaiterCalled),
    isPaid: orders.some(orderIsPaid),
  };
}

async function fetchActiveWaiterCallsByTableKey(
  merchantOid: Types.ObjectId
): Promise<Map<string, { id: string }>> {
  const calls = await WaiterCall.find({
    merchantId: merchantOid,
    type: "waiter_call",
    status: { $in: ACTIVE_WAITER_CALL_STATUSES },
  })
    .sort({ createdAt: -1 })
    .lean();

  const map = new Map<string, { id: string }>();
  for (const call of calls) {
    const key = waiterCallTableKey(call.tableName);
    if (!map.has(key)) {
      map.set(key, { id: String(call._id) });
    }
  }
  return map;
}

/** Restaurant scope: tenant rows + legacy rows without restaurantId on same merchant */
function buildTableLayoutScopeFilter(
  merchantOid: Types.ObjectId,
  restaurantId: Types.ObjectId | null
): Record<string, unknown> {
  if (restaurantId) {
    return {
      merchantId: merchantOid,
      $or: [
        { restaurantId },
        { restaurantId: { $exists: false } },
        { restaurantId: null },
      ],
    };
  }
  return { merchantId: merchantOid };
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

async function insertMissingTableLayouts(
  merchantOid: Types.ObjectId,
  restaurantId: Types.ObjectId | null,
  layouts: FloorLayoutTable[]
): Promise<void> {
  if (layouts.length === 0) return;

  const normalizedNames = layouts.map((layout) =>
    layout.tableName.trim().toLowerCase()
  );

  const existing = await TableLayout.find({
    merchantId: merchantOid,
    normalizedTableName: { $in: normalizedNames },
  })
    .select("normalizedTableName")
    .lean();

  const existingKeys = new Set(
    existing.map((row) => row.normalizedTableName)
  );

  for (const layout of layouts) {
    const normalizedTableName = layout.tableName.trim().toLowerCase();
    if (existingKeys.has(normalizedTableName)) {
      continue;
    }

    try {
      await TableLayout.create({
        merchantId: merchantOid,
        restaurantId: restaurantId ?? undefined,
        tableName: layout.tableName,
        normalizedTableName,
        description: layout.description,
        shape: layout.shape,
        color: "#4A7FE5",
        hallId: layout.hallId,
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
      });
      existingKeys.add(normalizedTableName);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        continue;
      }
      console.warn("[tables] layout seed insert:", err);
    }
  }
}

async function resolveTableLayoutsForMerchant(
  merchantOid: Types.ObjectId,
  restaurantId: Types.ObjectId | null,
  tableNames: string[]
): Promise<FloorLayoutTable[]> {
  if (tableNames.length === 0) return [];

  const scopeFilter = buildTableLayoutScopeFilter(merchantOid, restaurantId);
  const docs = await TableLayout.find(scopeFilter).lean();

  const saved = docs.map((d) =>
    layoutDocToFloorTable({
      _id: d._id,
      tableName: d.tableName,
      hallId: d.hallId,
      description: d.description,
      shape: d.shape,
      x: d.x,
      y: d.y,
      width: d.width,
      height: d.height,
    })
  );

  const merged = mergeFloorLayouts(tableNames, saved);
  const savedKeys = new Set(
    docs.map((d) => normalizeTableNameKey(d.tableName))
  );
  const toInsert = merged.filter(
    (m) => !savedKeys.has(normalizeTableNameKey(m.tableName))
  );

  if (docs.length > 0 && toInsert.length === 0) {
    return merged;
  }

  if (toInsert.length > 0) {
    await insertMissingTableLayouts(merchantOid, restaurantId, toInsert);
  }

  return merged;
}

async function fetchLatestOrderTimeByTable(
  baseMatch: Record<string, unknown>,
  tableNames: string[]
): Promise<Map<string, Date>> {
  const map = new Map<string, Date>();
  if (tableNames.length === 0) return map;

  const rows = await Order.aggregate<{ _id: string; latest: Date }>([
    {
      $match: {
        ...baseMatch,
        tableName: { $in: tableNames },
      },
    },
    { $group: { _id: "$tableName", latest: { $max: "$createdAt" } } },
  ]);

  for (const row of rows) {
    if (row._id && row.latest) map.set(row._id, row.latest);
  }
  return map;
}

export async function GET(req: NextRequest) {
  try {
    await mongoServer();

    const tableName = req.nextUrl.searchParams.get("tableName");
    const merchantOid = await resolveTablesMerchantId(req);
    const baseMatch: Record<string, unknown> = {};

    let restaurantId: Types.ObjectId | null = null;
    if (merchantOid) {
      baseMatch.merchantId = merchantOid;
      restaurantId = await resolveRestaurantIdForMerchant(merchantOid);
      if (restaurantId) {
        baseMatch.restaurantId = restaurantId;
      }
    }

    if (tableName) {
      const activeOrders = await Order.find({
        ...baseMatch,
        tableName,
        status: { $in: ACTIVE_TABLE_ORDER_STATUSES },
      })
        .select(ACTIVE_ORDER_SELECT)
        .sort({ createdAt: -1 })
        .lean();

      let latest = activeOrders[0]?.createdAt ?? null;
      if (!latest) {
        const last = await Order.findOne({ ...baseMatch, tableName })
          .select("createdAt")
          .sort({ createdAt: -1 })
          .lean();
        latest = last?.createdAt ?? null;
      }

      const statuses: OrderStatus[] = activeOrders.map(
        (o) => o.status as OrderStatus
      );
      const totalAmount = activeOrders.reduce((sum, o) => sum + o.total, 0);

      return sendRJResponse({
        success: true,
        message: "Table detail fetched",
        data: {
          tableName,
          restaurantId: restaurantId ? String(restaurantId) : undefined,
          status: deriveTableDisplayStatus(statuses),
          activeOrderCount: activeOrders.length,
          itemCount: sumItemCount(activeOrders),
          totalAmount,
          latestOrderTime: latest ? latest.toISOString() : null,
          orders: activeOrders.map(serializeOrder),
        },
        status: 200,
      });
    }

    const [activeOrders, qrDocs] = await Promise.all([
      Order.find({
        ...baseMatch,
        status: { $in: ACTIVE_TABLE_ORDER_STATUSES },
      })
        .select(ACTIVE_ORDER_SELECT)
        .sort({ createdAt: -1 })
        .lean(),
      merchantOid
        ? MQR.find({ merchantId: merchantOid })
            .sort({ createdAt: 1 })
            .select("name")
            .lean()
        : Promise.resolve([]),
    ]);

    const activeByTable = new Map<string, ActiveOrderLean[]>();
    for (const order of activeOrders) {
      const list = activeByTable.get(order.tableName) ?? [];
      list.push(order as ActiveOrderLean);
      activeByTable.set(order.tableName, list);
    }

    for (const list of activeByTable.values()) {
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const qrTableNames = qrDocs.map((q) => q.name);

    let allTableNames: string[];
    if (merchantOid) {
      const layoutDocs = await TableLayout.find(
        buildTableLayoutScopeFilter(merchantOid, restaurantId)
      )
        .select("tableName")
        .lean();
      const layoutOnly = layoutDocs
        .map((d) => d.tableName)
        .filter(
          (n) => !qrTableNames.some((q) => normalizeTableNameKey(q) === normalizeTableNameKey(n))
        );
      allTableNames = mergeTableNameList(qrTableNames, layoutOnly);
    } else {
      const orderTableNames = new Set<string>();
      for (const order of activeOrders) {
        if (order.tableName && order.tableName !== UNKNOWN_TABLE) {
          orderTableNames.add(order.tableName);
        }
      }
      allTableNames = mergeTableNameList([], orderTableNames);
    }

    const emptyTableNames = allTableNames.filter(
      (name) => (activeByTable.get(name) ?? []).length === 0
    );
    const latestOrderTimeByTable = await fetchLatestOrderTimeByTable(
      baseMatch,
      emptyTableNames
    );

    let waiterCallsByTableKey = new Map<string, { id: string }>();
    if (merchantOid) {
      waiterCallsByTableKey = await fetchActiveWaiterCallsByTableKey(merchantOid);
    }

    const summaries = allTableNames.map((name) =>
      buildTableSummary(
        name,
        activeByTable.get(name) ?? [],
        latestOrderTimeByTable,
        waiterCallsByTableKey.get(waiterCallTableKey(name))
      )
    );

    let withLayout = summaries;
    let halls: Awaited<ReturnType<typeof ensureMerchantHalls>> = [];
    if (merchantOid) {
      halls = await ensureMerchantHalls(merchantOid);
      const layouts = await resolveTableLayoutsForMerchant(
        merchantOid,
        restaurantId,
        allTableNames
      );
      const layoutByName = new Map(
        layouts.map((layout) => [layout.tableName, layout])
      );
      withLayout = summaries.map((row) => ({
        ...row,
        layout: layoutByName.get(row.tableName),
      }));
    }

    return sendRJResponse({
      success: true,
      message: "Tables fetched",
      data: {
        halls,
        tables: withLayout,
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

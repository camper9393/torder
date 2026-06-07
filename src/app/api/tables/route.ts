import mongoServer from "@/config/mongoConfig";
import { verifyAuth } from "@/middleware/auth";
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
import { NextRequest, NextResponse } from "next/server";

const ACTIVE_ORDER_SELECT =
  "tableName status total createdAt items.title items.nameMn items.nameEn items.selectedSizeLabelMn items.selectedSizeLabelEn items.menuItemId items.price items.quantity items.served items.image";

/** Logged-in merchant (cookie) or explicit ?merchantId= query. */
async function resolveTablesMerchantId(
  req: NextRequest
): Promise<Types.ObjectId | null> {
  const queryId = req.nextUrl.searchParams.get("merchantId");

  const authResult = await verifyAuth(req);
  if (authResult && !(authResult instanceof NextResponse)) {
    const id = String(authResult);
    if (isValidObjectId(id)) return new Types.ObjectId(id);
  }

  if (queryId && isValidObjectId(queryId)) {
    return new Types.ObjectId(queryId);
  }

  return null;
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

async function resolveTableLayoutsForMerchant(
  merchantOid: Types.ObjectId,
  tableNames: string[]
): Promise<FloorLayoutTable[]> {
  if (tableNames.length === 0) return [];

  const docs = await TableLayout.find({ merchantId: merchantOid }).lean();

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
    docs.map((d) => d.tableName.trim().toLowerCase())
  );
  const toInsert = merged.filter(
    (m) => !savedKeys.has(m.tableName.trim().toLowerCase())
  );

  if (toInsert.length > 0) {
    try {
      await TableLayout.insertMany(
        toInsert.map((layout) => ({
          merchantId: merchantOid,
          tableName: layout.tableName,
          normalizedTableName: layout.tableName.trim().toLowerCase(),
          description: layout.description,
          shape: layout.shape,
          color: "#4A7FE5",
          hallId: layout.hallId,
          x: layout.x,
          y: layout.y,
          width: layout.width,
          height: layout.height,
        })),
        { ordered: false }
      );
    } catch (err) {
      console.warn("[tables] layout seed insert:", err);
    }
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

    if (merchantOid) {
      baseMatch.merchantId = merchantOid;
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
      const layoutDocs = await TableLayout.find({ merchantId: merchantOid })
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

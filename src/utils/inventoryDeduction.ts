import { InventoryItem } from "@/model/inventoryItem";
import {
  InventoryTransaction,
  type IInventoryTransaction,
} from "@/model/inventoryTransaction";
import { Menu } from "@/model/menu";
import { Recipe } from "@/model/recipe";
import { Merchants } from "@/model/merchants";
import type { IOrder, IOrderItem } from "@/model/order";
import { convertInventoryQuantity } from "@/utils/inventoryUnits";
import type { InventoryUnit } from "@/model/inventoryItem";
import { Types } from "mongoose";

type NewInventoryTransaction = Omit<
  IInventoryTransaction,
  "_id" | "createdAt" | "updatedAt"
>;

type DeductionLine = {
  inventoryItemId: Types.ObjectId;
  quantity: number;
  unit: InventoryUnit;
  unitCost: number;
  menuItemId: string;
  menuTitle: string;
};

function orderLineUsageNote(orderId: Types.ObjectId, itemIndex: number): string {
  return `line:${String(orderId)}:${itemIndex}`;
}

function toMenuObjectId(id: unknown): Types.ObjectId | null {
  if (id === undefined || id === null || id === "") return null;
  const str = String(id);
  return Types.ObjectId.isValid(str) ? new Types.ObjectId(str) : null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aggregateDeductions(
  lines: DeductionLine[]
): Map<string, DeductionLine> {
  const map = new Map<string, DeductionLine>();
  for (const line of lines) {
    const key = String(line.inventoryItemId);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...line });
      continue;
    }
    if (existing.unit === line.unit) {
      existing.quantity += line.quantity;
    } else {
      const converted = convertInventoryQuantity(
        line.quantity,
        line.unit,
        existing.unit
      );
      if (converted !== null) {
        existing.quantity += converted;
      } else {
        console.warn("[inventory] Could not aggregate ingredient quantities — unit mismatch", {
          inventoryItemId: key,
          fromUnit: line.unit,
          toUnit: existing.unit,
        });
      }
    }
  }
  return map;
}

type OrderItemIdFields = IOrderItem & {
  productId?: unknown;
  itemId?: unknown;
  _id?: unknown;
};

async function resolveMenuItemIdForLine(
  merchantId: Types.ObjectId,
  item: IOrderItem,
  index: number
): Promise<Types.ObjectId | null> {
  const raw = item as OrderItemIdFields;
  const idCandidates = [
    raw.menuItemId,
    raw.productId,
    raw.itemId,
    raw._id,
  ];
  for (const candidate of idCandidates) {
    const parsed = toMenuObjectId(candidate);
    if (parsed) return parsed;
  }

  const title = String(item.title ?? "").trim();
  const nameMn = String(item.nameMn ?? "").trim();
  const nameEn = String(item.nameEn ?? "").trim();

  if (!title && !nameMn && !nameEn) {
    console.warn("[inventory] Order line missing menuItemId and name", {
      lineIndex: index,
    });
    return null;
  }

  const orFilters: Record<string, unknown>[] = [];
  if (title) {
    orFilters.push({
      title: { $regex: `^${escapeRegex(title)}$`, $options: "i" },
    });
  }
  if (nameMn) {
    orFilters.push({
      nameMn: { $regex: `^${escapeRegex(nameMn)}$`, $options: "i" },
    });
  }
  if (nameEn) {
    orFilters.push({
      nameEn: { $regex: `^${escapeRegex(nameEn)}$`, $options: "i" },
    });
  }

  const menu = await Menu.findOne({
    merchantId,
    $or: orFilters,
  })
    .select("_id title")
    .lean();

  if (!menu) {
    console.warn("[inventory] Could not resolve menuItemId from order line", {
      lineIndex: index,
      title,
      nameMn,
      nameEn,
    });
    return null;
  }

  console.info("[inventory] Resolved menuItemId from menu name fallback", {
    lineIndex: index,
    menuItemId: String(menu._id),
    title: menu.title,
  });

  return menu._id as Types.ObjectId;
}

async function buildDeductionLines(
  merchantId: Types.ObjectId,
  items: IOrderItem[],
  itemIndices?: number[]
): Promise<DeductionLine[]> {
  const indices =
    itemIndices ??
    items.map((_, index) => index).filter((index) => index < items.length);

  const resolvedMenuIds = await Promise.all(
    indices.map((index) =>
      resolveMenuItemIdForLine(merchantId, items[index], index)
    )
  );

  const menuIds = resolvedMenuIds.filter(
    (id): id is Types.ObjectId => id !== null
  );

  if (menuIds.length === 0) {
    console.warn("[inventory] No menuItemIds resolved for order items");
    return [];
  }

  const recipes = await Recipe.find({
    merchantId,
    menuItemId: { $in: menuIds },
  }).lean();

  const recipeByMenu = new Map(
    recipes.map((r) => [String(r.menuItemId), r.ingredients])
  );

  const lines: DeductionLine[] = [];

  for (let i = 0; i < indices.length; i++) {
    const orderIndex = indices[i];
    const orderItem = items[orderIndex];
    const menuItemId = resolvedMenuIds[i];
    if (!orderItem || !menuItemId) continue;

    const menuKey = String(menuItemId);
    const ingredients = recipeByMenu.get(menuKey);

    if (!ingredients?.length) {
      console.warn("[inventory] No recipe linked for menu item — skipping deduction", {
        menuItemId: menuKey,
        title: orderItem.title,
        quantity: orderItem.quantity,
        lineIndex: orderIndex,
      });
      continue;
    }

    console.info("[inventory] Recipe found for menu item", {
      menuItemId: menuKey,
      title: orderItem.title,
      ingredientCount: ingredients.length,
      orderQuantity: orderItem.quantity,
      lineIndex: orderIndex,
    });

    for (const ing of ingredients) {
      lines.push({
        inventoryItemId: ing.inventoryItemId as Types.ObjectId,
        quantity: ing.quantity * orderItem.quantity,
        unit: ing.unit,
        unitCost: 0,
        menuItemId: menuKey,
        menuTitle: orderItem.title,
      });
    }
  }

  if (lines.length === 0) return [];

  const itemIds = [...new Set(lines.map((l) => String(l.inventoryItemId)))];
  const inventoryRows = await InventoryItem.find({
    _id: { $in: itemIds },
    merchantId,
  })
    .select("_id unitCost unit name")
    .lean();

  const costById = new Map(
    inventoryRows.map((row) => [
      String(row._id),
      { unitCost: row.unitCost, unit: row.unit as InventoryUnit },
    ])
  );

  return lines
    .map((line) => {
      const meta = costById.get(String(line.inventoryItemId));
      if (!meta) {
        console.warn("[inventory] Inventory item missing for recipe ingredient", {
          inventoryItemId: String(line.inventoryItemId),
          menuItemId: line.menuItemId,
          menuTitle: line.menuTitle,
        });
        return null;
      }
      return {
        ...line,
        unitCost: meta.unitCost,
      };
    })
    .filter((line): line is DeductionLine => line !== null);
}

async function hasLegacyOrderUsage(
  merchantId: Types.ObjectId,
  orderId: Types.ObjectId
): Promise<boolean> {
  const exists = await InventoryTransaction.exists({
    merchantId,
    orderId,
    type: "usage",
    notes: { $regex: /^Захиалга #/ },
  });
  return Boolean(exists);
}

async function hasOrderLineUsage(
  merchantId: Types.ObjectId,
  orderId: Types.ObjectId,
  itemIndex: number
): Promise<boolean> {
  if (await hasLegacyOrderUsage(merchantId, orderId)) {
    return true;
  }

  const marker = orderLineUsageNote(orderId, itemIndex);
  const exists = await InventoryTransaction.exists({
    merchantId,
    orderId,
    type: "usage",
    notes: marker,
  });
  return Boolean(exists);
}

async function applyDeductionLines(
  order: IOrder,
  aggregated: Map<string, DeductionLine>,
  userId: Types.ObjectId | undefined,
  notes: string
): Promise<void> {
  const merchantId = order.merchantId as Types.ObjectId;
  const orderId = order._id as Types.ObjectId;

  if (
    await InventoryTransaction.exists({
      merchantId,
      orderId,
      type: "usage",
      notes,
    })
  ) {
    console.info("[inventory] Duplicate deduction skipped", {
      orderId: String(orderId),
      notes,
    });
    return;
  }

  const itemIds = [...aggregated.keys()].map((id) => new Types.ObjectId(id));

  const inventoryDocs = await InventoryItem.find({
    _id: { $in: itemIds },
    merchantId,
  });

  const docById = new Map(
    inventoryDocs.map((doc) => [String(doc._id), doc])
  );

  let userName = "Ажилтан";
  if (userId) {
    const merchant = await Merchants.findById(userId).select("name").lean();
    if (merchant?.name) userName = merchant.name;
  }

  const transactions: NewInventoryTransaction[] = [];

  for (const [itemId, line] of aggregated) {
    const doc = docById.get(itemId);
    if (!doc) {
      console.warn("[inventory] Inventory item not found during deduction", {
        inventoryItemId: itemId,
        orderId: String(orderId),
      });
      continue;
    }

    let deductQty = line.quantity;
    const itemUnit = doc.unit as InventoryUnit;
    if (line.unit !== itemUnit) {
      const converted = convertInventoryQuantity(
        line.quantity,
        line.unit,
        itemUnit
      );
      if (converted === null) {
        console.warn("[inventory] Unit conversion failed — skipping ingredient", {
          inventoryItemId: itemId,
          fromUnit: line.unit,
          toUnit: itemUnit,
          quantity: line.quantity,
        });
        continue;
      }
      deductQty = converted;
    }

    const stockBefore = doc.currentStock;
    const newStock = Math.max(0, stockBefore - deductQty);
    doc.currentStock = newStock;
    await doc.save();

    transactions.push({
      merchantId,
      inventoryItemId: doc._id,
      orderId,
      type: "usage",
      quantity: -deductQty,
      unit: itemUnit,
      unitCost: doc.unitCost,
      remainingStock: newStock,
      userId,
      userName,
      notes,
    });

    console.info("[inventory] Deducted stock", {
      orderId: String(orderId),
      itemName: doc.name,
      deducted: deductQty,
      unit: itemUnit,
      stockBefore,
      stockAfter: newStock,
    });
  }

  if (transactions.length > 0) {
    await InventoryTransaction.insertMany(transactions);
    console.info("[inventory] Usage transactions saved", {
      orderId: String(orderId),
      count: transactions.length,
      notes,
    });
  }
}

/** Deduct inventory for one served order line (Захиалга өгсөн). */
export async function deductInventoryForOrderItem(
  order: IOrder,
  itemIndex: number,
  userId?: Types.ObjectId
): Promise<void> {
  const merchantId = order.merchantId as Types.ObjectId;
  const orderId = order._id as Types.ObjectId;

  if (itemIndex < 0 || itemIndex >= order.items.length) {
    console.warn("[inventory] Invalid order line index for deduction", {
      orderId: String(orderId),
      itemIndex,
    });
    return;
  }

  if (await hasOrderLineUsage(merchantId, orderId, itemIndex)) {
    console.info("[inventory] Order line already deducted — skip", {
      orderId: String(orderId),
      itemIndex,
    });
    return;
  }

  const rawLines = await buildDeductionLines(merchantId, order.items, [itemIndex]);
  if (rawLines.length === 0) {
    console.warn("[inventory] No deduction lines for order item", {
      orderId: String(orderId),
      itemIndex,
      title: order.items[itemIndex]?.title,
    });
    return;
  }

  const aggregated = aggregateDeductions(rawLines);
  const marker = orderLineUsageNote(orderId, itemIndex);
  await applyDeductionLines(order, aggregated, userId, marker);
}

/** Deduct inventory for all order lines not yet recorded. */
export async function deductInventoryForOrder(
  order: IOrder,
  userId?: Types.ObjectId
): Promise<void> {
  const merchantId = order.merchantId as Types.ObjectId;
  const orderId = order._id as Types.ObjectId;

  const pendingIndices: number[] = [];
  for (let i = 0; i < order.items.length; i++) {
    if (!(await hasOrderLineUsage(merchantId, orderId, i))) {
      pendingIndices.push(i);
    }
  }

  if (pendingIndices.length === 0) {
    console.info("[inventory] All order lines already deducted", {
      orderId: String(orderId),
    });
    return;
  }

  if (await hasLegacyOrderUsage(merchantId, orderId)) {
    console.info("[inventory] Legacy order usage exists — skip full order deduction", {
      orderId: String(orderId),
    });
    return;
  }

  for (const itemIndex of pendingIndices) {
    const lineRaw = await buildDeductionLines(merchantId, order.items, [itemIndex]);
    if (lineRaw.length === 0) continue;

    const aggregated = aggregateDeductions(lineRaw);
    const marker = orderLineUsageNote(orderId, itemIndex);
    await applyDeductionLines(order, aggregated, userId, marker);
  }
}

function refundReturnNote(
  orderId: Types.ObjectId,
  lineIndex: number,
  refundId: Types.ObjectId
): string {
  return `refund_return:${String(orderId)}:${lineIndex}:${String(refundId)}`;
}

async function buildReturnLinesForQuantity(
  merchantId: Types.ObjectId,
  items: IOrderItem[],
  lineIndex: number,
  refundQuantity: number
): Promise<DeductionLine[]> {
  if (lineIndex < 0 || lineIndex >= items.length || refundQuantity <= 0) {
    return [];
  }

  const rawLines = await buildDeductionLines(merchantId, items, [lineIndex]);
  if (rawLines.length === 0) return [];

  const orderItem = items[lineIndex];
  const scale = refundQuantity / orderItem.quantity;

  return rawLines.map((line) => ({
    ...line,
    quantity: line.quantity * scale,
  }));
}

async function applyReturnLines(
  order: IOrder,
  aggregated: Map<string, DeductionLine>,
  userId: Types.ObjectId | undefined,
  notes: string,
  refundId: Types.ObjectId
): Promise<void> {
  const merchantId = order.merchantId as Types.ObjectId;
  const orderId = order._id as Types.ObjectId;

  if (
    await InventoryTransaction.exists({
      merchantId,
      orderId,
      type: "refund_return",
      notes,
    })
  ) {
    console.info("[inventory] Duplicate refund return skipped", {
      orderId: String(orderId),
      notes,
    });
    return;
  }

  const itemIds = [...aggregated.keys()].map((id) => new Types.ObjectId(id));
  const inventoryDocs = await InventoryItem.find({
    _id: { $in: itemIds },
    merchantId,
  });

  const docById = new Map(
    inventoryDocs.map((doc) => [String(doc._id), doc])
  );

  let userName = "Ажилтан";
  if (userId) {
    const merchant = await Merchants.findById(userId).select("name").lean();
    if (merchant?.name) userName = merchant.name;
  }

  const transactions: NewInventoryTransaction[] = [];

  for (const [itemId, line] of aggregated) {
    const doc = docById.get(itemId);
    if (!doc) {
      throw new Error(
        `Агуулахын бараа олдсонгүй: ${itemId} (буцаалтын үлдэгдэл нэмэх боломжгүй)`
      );
    }

    let returnQty = line.quantity;
    const itemUnit = doc.unit as InventoryUnit;
    if (line.unit !== itemUnit) {
      const converted = convertInventoryQuantity(
        line.quantity,
        line.unit,
        itemUnit
      );
      if (converted === null) {
        throw new Error(
          `Нэгж хөрвүүлэх амжилтгүй: ${line.unit} → ${itemUnit} (${doc.name})`
        );
      }
      returnQty = converted;
    }

    if (returnQty <= 0) continue;

    const stockBefore = doc.currentStock;
    const newStock = stockBefore + returnQty;
    doc.currentStock = newStock;
    await doc.save();

    transactions.push({
      merchantId,
      inventoryItemId: doc._id,
      orderId,
      type: "refund_return",
      quantity: returnQty,
      unit: itemUnit,
      unitCost: doc.unitCost,
      remainingStock: newStock,
      userId,
      userName,
      notes,
    });

    console.info("[inventory] Refund return — stock increased", {
      orderId: String(orderId),
      refundId: String(refundId),
      itemName: doc.name,
      returned: returnQty,
      unit: itemUnit,
      stockBefore,
      stockAfter: newStock,
    });
  }

  if (transactions.length > 0) {
    await InventoryTransaction.insertMany(transactions);
  }
}

/** Increase inventory for a refunded order line when returnToInventory is enabled. */
export async function returnInventoryForRefundLine(
  order: IOrder,
  lineIndex: number,
  refundQuantity: number,
  refundId: Types.ObjectId,
  userId?: Types.ObjectId
): Promise<void> {
  const merchantId = order.merchantId as Types.ObjectId;
  const orderId = order._id as Types.ObjectId;

  const rawLines = await buildReturnLinesForQuantity(
    merchantId,
    order.items,
    lineIndex,
    refundQuantity
  );

  if (rawLines.length === 0) {
    throw new Error(
      `Жор холбогдоогүй эсвэл агуулахын бараа олдсонгүй: "${order.items[lineIndex]?.title ?? lineIndex}"`
    );
  }

  const aggregated = aggregateDeductions(rawLines);
  const marker = refundReturnNote(orderId, lineIndex, refundId);
  await applyReturnLines(order, aggregated, userId, marker, refundId);
}

export async function getInventoryAlerts(
  merchantId: Types.ObjectId,
  limit = 10
) {
  const items = await InventoryItem.find({ merchantId })
    .select("name currentStock minimumStock unit")
    .lean();

  const alerts = items
    .map((item) => {
      const stock = item.currentStock;
      const min = item.minimumStock;
      if (stock <= 0) {
        return {
          itemId: String(item._id),
          itemName: item.name,
          status: "out" as const,
          currentStock: stock,
          unit: item.unit,
          minimumStock: min,
        };
      }
      if (stock <= min) {
        return {
          itemId: String(item._id),
          itemName: item.name,
          status: "low" as const,
          currentStock: stock,
          unit: item.unit,
          minimumStock: min,
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a!.status === "out" && b!.status !== "out") return -1;
      if (b!.status === "out" && a!.status !== "out") return 1;
      return a!.currentStock - b!.currentStock;
    })
    .slice(0, limit);

  return alerts;
}

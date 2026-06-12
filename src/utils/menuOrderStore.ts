import mongoose from "mongoose";
import { Menu } from "@/model/menu";
import { MenuOrder } from "@/model/menuOrder";
import { resolveRestaurantIdForMerchant } from "@/lib/tenant";
import {
  CategoryIconName,
  sanitizeSectionIcons,
} from "@/utils/categoryIcons";
import { sanitizeItemOrders } from "@/utils/menuOrder";
import {
  sanitizeSectionMeta,
  type SectionMetaMap,
} from "@/utils/sectionMeta";

export type MenuOrderSnapshot = {
  sectionOrder: string[];
  itemOrders: Record<string, string[]>;
  sectionIcons: Record<string, CategoryIconName>;
  sectionMeta: SectionMetaMap;
};

export async function getMenuOrderSnapshot(
  merchantId: mongoose.Types.ObjectId
): Promise<MenuOrderSnapshot> {
  const doc = await MenuOrder.findOne({ merchantId }).lean();
  if (!doc) {
    return {
      sectionOrder: [],
      itemOrders: {},
      sectionIcons: {},
      sectionMeta: {},
    };
  }
  return {
    sectionOrder: Array.isArray(doc.sectionOrder)
      ? doc.sectionOrder.filter((v: unknown): v is string => typeof v === "string")
      : [],
    itemOrders: sanitizeItemOrders(
      doc.itemOrders as Record<string, string[]> | undefined
    ),
    sectionIcons: sanitizeSectionIcons(
      doc.sectionIcons as Record<string, unknown> | undefined
    ),
    sectionMeta: sanitizeSectionMeta(
      doc.sectionMeta as Record<string, unknown> | undefined
    ),
  };
}

async function upsertMenuOrderDoc(
  merchantId: mongoose.Types.ObjectId,
  update: Partial<MenuOrderSnapshot>
) {
  const restaurantId = await resolveRestaurantIdForMerchant(merchantId);
  const $set: Record<string, unknown> = {};
  if (update.sectionOrder) {
    $set.sectionOrder = update.sectionOrder;
  }
  if (update.itemOrders) {
    $set.itemOrders = update.itemOrders;
  }
  if (update.sectionIcons) {
    $set.sectionIcons = update.sectionIcons;
  }
  if (update.sectionMeta) {
    $set.sectionMeta = update.sectionMeta;
  }

  const $setOnInsert: Record<string, unknown> = { merchantId };
  if (restaurantId) {
    $setOnInsert.restaurantId = restaurantId;
  }

  return MenuOrder.findOneAndUpdate(
    { merchantId },
    { $set, $setOnInsert },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function saveMenuOrderSectionOrder(
  merchantId: mongoose.Types.ObjectId,
  sectionOrder: string[]
) {
  await upsertMenuOrderDoc(merchantId, { sectionOrder });
}

export async function saveMenuOrderSectionIcon(
  merchantId: mongoose.Types.ObjectId,
  section: string,
  icon: CategoryIconName
) {
  const restaurantId = await resolveRestaurantIdForMerchant(merchantId);
  const $setOnInsert: Record<string, unknown> = { merchantId };
  if (restaurantId) {
    $setOnInsert.restaurantId = restaurantId;
  }

  await MenuOrder.findOneAndUpdate(
    { merchantId },
    {
      $set: {
        [`sectionIcons.${section}`]: icon,
      },
      $setOnInsert,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function saveMenuOrderItemOrder(
  merchantId: mongoose.Types.ObjectId,
  section: string,
  ids: string[]
) {
  const current = await getMenuOrderSnapshot(merchantId);
  const itemOrders = { ...current.itemOrders, [section]: ids };
  await upsertMenuOrderDoc(merchantId, { itemOrders });
}

export async function renameMenuOrderSection(
  merchantId: mongoose.Types.ObjectId,
  from: string,
  to: string
) {
  const current = await getMenuOrderSnapshot(merchantId);
  const sectionOrder = current.sectionOrder.map((label) =>
    label === from ? to : label
  );
  const itemOrders = { ...current.itemOrders };
  if (itemOrders[from]) {
    itemOrders[to] = itemOrders[from];
    delete itemOrders[from];
  }
  const sectionIcons = { ...current.sectionIcons };
  if (sectionIcons[from]) {
    sectionIcons[to] = sectionIcons[from];
    delete sectionIcons[from];
  }
  const sectionMeta = { ...current.sectionMeta };
  if (sectionMeta[from]) {
    sectionMeta[to] = sectionMeta[from];
    delete sectionMeta[from];
  }
  await upsertMenuOrderDoc(merchantId, {
    sectionOrder,
    itemOrders,
    sectionIcons,
    sectionMeta,
  });
}

export async function removeMenuOrderSection(
  merchantId: mongoose.Types.ObjectId,
  section: string
) {
  const current = await getMenuOrderSnapshot(merchantId);
  const sectionOrder = current.sectionOrder.filter((label) => label !== section);
  const itemOrders = { ...current.itemOrders };
  delete itemOrders[section];
  const sectionIcons = { ...current.sectionIcons };
  delete sectionIcons[section];
  const sectionMeta = { ...current.sectionMeta };
  delete sectionMeta[section];
  await upsertMenuOrderDoc(merchantId, {
    sectionOrder,
    itemOrders,
    sectionIcons,
    sectionMeta,
  });
}

export async function removeMenuOrderItem(
  merchantId: mongoose.Types.ObjectId,
  section: string,
  itemId: string
) {
  const current = await getMenuOrderSnapshot(merchantId);
  const ids = current.itemOrders[section];
  if (!ids?.includes(itemId)) return;
  const itemOrders = {
    ...current.itemOrders,
    [section]: ids.filter((id) => id !== itemId),
  };
  await upsertMenuOrderDoc(merchantId, { itemOrders });
}

export async function moveMenuOrderItemBetweenSections(
  merchantId: mongoose.Types.ObjectId,
  itemId: string,
  fromSection: string,
  toSection: string
) {
  const current = await getMenuOrderSnapshot(merchantId);
  const itemOrders = { ...current.itemOrders };
  itemOrders[fromSection] = (itemOrders[fromSection] ?? []).filter(
    (id) => id !== itemId
  );
  itemOrders[toSection] = [...(itemOrders[toSection] ?? []), itemId];
  await upsertMenuOrderDoc(merchantId, { itemOrders });
}

export type UpsertSectionInput = {
  key?: string;
  labelMn: string;
  labelEn: string;
  icon: CategoryIconName;
};

export class MenuSectionConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MenuSectionConflictError";
  }
}

export async function upsertMenuSection(
  merchantId: mongoose.Types.ObjectId,
  input: UpsertSectionInput
): Promise<{ key: string }> {
  const labelMn = input.labelMn.trim();
  const labelEn = input.labelEn.trim() || labelMn;
  if (!labelMn) {
    throw new Error("Mongolian category name is required");
  }

  let current = await getMenuOrderSnapshot(merchantId);
  const newKey = labelMn;
  const oldKey = input.key?.trim();

  const existingKeys = new Set([
    ...current.sectionOrder,
    ...Object.keys(current.sectionMeta),
  ]);

  if (!oldKey && existingKeys.has(newKey)) {
    throw new MenuSectionConflictError("Section already exists");
  }

  if (oldKey && oldKey !== newKey && existingKeys.has(newKey)) {
    throw new MenuSectionConflictError("Section name already in use");
  }

  if (oldKey && oldKey !== newKey) {
    await renameMenuOrderSection(merchantId, oldKey, newKey);
    await Menu.updateMany(
      { merchantId, section: oldKey },
      { $set: { section: newKey } }
    );
    current = await getMenuOrderSnapshot(merchantId);
  }

  const sectionOrder = current.sectionOrder.includes(newKey)
    ? current.sectionOrder
    : [...current.sectionOrder, newKey];

  await MenuOrder.findOneAndUpdate(
    { merchantId },
    {
      $set: {
        sectionOrder,
        [`sectionMeta.${newKey}`]: { labelMn, labelEn },
        [`sectionIcons.${newKey}`]: input.icon,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return { key: newKey };
}

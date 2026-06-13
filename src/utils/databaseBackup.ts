import { Menu } from "@/model/menu";
import { MenuOrder } from "@/model/menuOrder";
import { Merchants } from "@/model/merchants";
import { Order } from "@/model/order";
import { MQR } from "@/model/qrs";
import { TableHall } from "@/model/tableHall";
import { TableLayout } from "@/model/tableLayout";
import type mongoose from "mongoose";

export type DatabaseBackupPayload = {
  meta: {
    version: 1;
    exportedAt: string;
    merchantId: string;
    app: "torder";
  };
  menuItems: unknown[];
  categories: {
    sectionOrder: string[];
    sectionMeta: Record<string, unknown>;
    sectionIcons: Record<string, unknown>;
    itemOrders: Record<string, string[]>;
    distinctSections: string[];
  };
  tables: {
    halls: unknown[];
    layouts: unknown[];
  };
  orders: unknown[];
  settings: {
    menuOrder: unknown | null;
    qrs: unknown[];
  };
  users: unknown[];
};

export function buildBackupFilename(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `torder-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}.json`;
}

export async function buildMerchantDatabaseBackup(
  merchantId: mongoose.Types.ObjectId
): Promise<DatabaseBackupPayload> {
  const merchantFilter = { merchantId };

  const [
    menuItems,
    menuOrder,
    distinctSections,
    tableHalls,
    tableLayouts,
    orders,
    qrs,
    merchant,
  ] = await Promise.all([
    Menu.find(merchantFilter).sort({ section: 1, title: 1 }).lean(),
    MenuOrder.findOne(merchantFilter).lean(),
    Menu.distinct("section", merchantFilter),
    TableHall.find(merchantFilter).sort({ sortOrder: 1, name: 1 }).lean(),
    TableLayout.find(merchantFilter).sort({ tableName: 1 }).lean(),
    Order.find(merchantFilter).sort({ createdAt: -1 }).lean(),
    MQR.find(merchantFilter).sort({ name: 1 }).lean(),
    Merchants.findById(merchantId)
      .select("-password")
      .lean(),
  ]);

  return {
    meta: {
      version: 1,
      exportedAt: new Date().toISOString(),
      merchantId: String(merchantId),
      app: "torder",
    },
    menuItems,
    categories: {
      sectionOrder: menuOrder?.sectionOrder ?? [],
      sectionMeta: menuOrder?.sectionMeta ?? {},
      sectionIcons: menuOrder?.sectionIcons ?? {},
      itemOrders: menuOrder?.itemOrders ?? {},
      distinctSections: distinctSections.filter(
        (section): section is string => typeof section === "string"
      ),
    },
    tables: {
      halls: tableHalls,
      layouts: tableLayouts,
    },
    orders,
    settings: {
      menuOrder: menuOrder ?? null,
      qrs,
    },
    users: merchant ? [merchant] : [],
  };
}

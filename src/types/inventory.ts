import type { InventoryUnit } from "@/model/inventoryItem";
import type { InventoryTransactionType } from "@/model/inventoryTransaction";

export type InventoryStockStatus = "ok" | "low" | "out";

export type InventoryItemRow = {
  _id: string;
  name: string;
  category: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  totalValue: number;
  image?: string;
  notes?: string;
  status: InventoryStockStatus;
};

export type InventoryDashboardData = {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  todayUsageCost: number;
  totalInventoryValue: number;
  alerts: InventoryAlert[];
};

export type InventoryAlert = {
  itemId: string;
  itemName: string;
  status: "low" | "out";
  currentStock: number;
  unit: InventoryUnit;
  minimumStock: number;
};

export type InventoryTransactionRow = {
  _id: string;
  createdAt: string;
  itemName: string;
  itemId: string;
  type: InventoryTransactionType;
  quantity: number;
  unit: InventoryUnit;
  remainingStock: number;
  userName: string;
  notes?: string;
};

export type RecipeIngredientRow = {
  inventoryItemId: string;
  itemName: string;
  quantity: number;
  unit: InventoryUnit;
  currentStock: number;
};

export type RecipeRow = {
  _id: string;
  menuItemId: string;
  menuItemName: string;
  menuItemImage?: string;
  ingredients: RecipeIngredientRow[];
};

export type InventoryReportsData = {
  todayUsage: number;
  weeklyUsage: number;
  inventoryValue: number;
  dailyConsumption: { date: string; label: string; cost: number }[];
  categoryConsumption: { category: string; cost: number }[];
  topUsedIngredients: { name: string; quantity: number; unit: string; cost: number }[];
};

export type PaginatedItemsResponse = {
  items: InventoryItemRow[];
  total: number;
  page: number;
  limit: number;
  categories: string[];
};

export type PaginatedTransactionsResponse = {
  transactions: InventoryTransactionRow[];
  total: number;
  page: number;
  limit: number;
};

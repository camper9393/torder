import type { InventoryUnit } from "@/model/inventoryItem";

const WEIGHT_UNITS: InventoryUnit[] = ["kg", "gram"];

export function convertInventoryQuantity(
  quantity: number,
  fromUnit: InventoryUnit,
  toUnit: InventoryUnit
): number | null {
  if (fromUnit === toUnit) return quantity;
  if (fromUnit === "kg" && toUnit === "gram") return quantity * 1000;
  if (fromUnit === "gram" && toUnit === "kg") return quantity / 1000;
  if (!WEIGHT_UNITS.includes(fromUnit) || !WEIGHT_UNITS.includes(toUnit)) {
    return null;
  }
  return null;
}

export function getInventoryStockStatus(
  currentStock: number,
  minimumStock: number
): "ok" | "low" | "out" {
  if (currentStock <= 0) return "out";
  if (currentStock <= minimumStock) return "low";
  return "ok";
}

export function formatInventoryUnit(unit: InventoryUnit): string {
  const labels: Record<InventoryUnit, string> = {
    kg: "кг",
    gram: "г",
    liter: "л",
    piece: "ш",
  };
  return labels[unit] ?? unit;
}

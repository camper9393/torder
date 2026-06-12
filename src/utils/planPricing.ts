import { RestaurantPlan } from "@/model/restaurant";

/** Сарын үнэ (тооцоолол) — бодит төлбөрийн интеграци хийгдээгүй */
export const PLAN_MONTHLY_PRICE_MNT: Record<RestaurantPlan, number> = {
  [RestaurantPlan.STARTER]: 99000,
  [RestaurantPlan.BUSINESS]: 199000,
  [RestaurantPlan.ENTERPRISE]: 499000,
};

export function getPlanMonthlyPrice(plan: RestaurantPlan): number {
  return PLAN_MONTHLY_PRICE_MNT[plan] ?? 0;
}

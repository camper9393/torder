import mongoServer from "@/config/mongoConfig";
import { logActivity } from "@/service/activityLogService";
import { extendRestaurantSubscription } from "@/service/platformRestaurantService";
import {
  PlatformPayment,
  PlatformPaymentMethod,
  PlatformPaymentStatus,
  type IPlatformPayment,
} from "@/model/platformPayment";
import { Restaurant, RestaurantPlan } from "@/model/restaurant";
import { IUser } from "@/model/user";
import { getPlanMonthlyPrice } from "@/utils/planPricing";
import { serializePayment } from "@/utils/platformSerialize";
import mongoose, { Types } from "mongoose";

export type PaymentFilters = {
  status?: PlatformPaymentStatus;
  restaurantId?: string;
};

export async function listPlatformPayments(filters: PaymentFilters = {}) {
  await mongoServer();
  const query: Record<string, unknown> = {};
  if (filters.status) query.status = filters.status;
  if (filters.restaurantId && mongoose.isValidObjectId(filters.restaurantId)) {
    query.restaurantId = new Types.ObjectId(filters.restaurantId);
  }

  const payments = await PlatformPayment.find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const restaurantIds = [...new Set(payments.map((p) => String(p.restaurantId)))];
  const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
    .select("name")
    .lean();
  const nameMap = new Map(restaurants.map((r) => [String(r._id), r.name]));

  return payments.map((p) =>
    serializePayment({
      ...p,
      restaurantName: nameMap.get(String(p.restaurantId)),
    } as IPlatformPayment & { restaurantName?: string })
  );
}

export type CreatePaymentInput = {
  restaurantId: string;
  amount?: number;
  currency?: string;
  plan?: RestaurantPlan;
  status?: PlatformPaymentStatus;
  paymentMethod?: PlatformPaymentMethod;
  dueDate?: string;
  note?: string;
  extendMonths?: number;
};

export async function createPlatformPayment(
  actor: IUser,
  input: CreatePaymentInput
) {
  await mongoServer();
  if (!mongoose.isValidObjectId(input.restaurantId)) {
    throw new Error("Буруу рестораны ID");
  }

  const restaurant = await Restaurant.findById(input.restaurantId);
  if (!restaurant) throw new Error("Ресторан олдсонгүй");

  const plan = input.plan ?? restaurant.plan;
  const amount = input.amount ?? getPlanMonthlyPrice(plan);
  const dueDate = input.dueDate
    ? new Date(input.dueDate)
    : new Date(restaurant.expireDate);

  const payment = await PlatformPayment.create({
    restaurantId: restaurant._id,
    amount,
    currency: input.currency ?? "MNT",
    plan,
    status: input.status ?? PlatformPaymentStatus.PENDING,
    paymentMethod: input.paymentMethod ?? PlatformPaymentMethod.MANUAL,
    dueDate,
    note: input.note ?? "",
    paidAt:
      input.status === PlatformPaymentStatus.PAID ? new Date() : undefined,
  });

  if (payment.status === PlatformPaymentStatus.PAID && input.extendMonths) {
    await extendRestaurantSubscription(
      String(restaurant._id),
      input.extendMonths
    );
  }

  await logActivity({
    actorUserId: actor._id,
    actorRole: actor.role,
    restaurantId: restaurant._id,
    action: "payment.created",
    targetType: "platform_payment",
    targetId: String(payment._id),
    message: `Төлбөр бүртгэгдлээ: ${restaurant.name}`,
    metadata: { amount, status: payment.status },
  });

  return serializePayment({
    ...payment.toObject(),
    restaurantName: restaurant.name,
  });
}

export async function updatePlatformPayment(
  actor: IUser,
  paymentId: string,
  input: {
    status?: PlatformPaymentStatus;
    note?: string;
    extendMonths?: number;
  }
) {
  await mongoServer();
  if (!mongoose.isValidObjectId(paymentId)) return null;

  const payment = await PlatformPayment.findById(paymentId);
  if (!payment) return null;

  const restaurant = await Restaurant.findById(payment.restaurantId);
  if (!restaurant) return null;

  if (input.status) {
    payment.status = input.status;
    if (input.status === PlatformPaymentStatus.PAID) {
      payment.paidAt = new Date();
      const months = input.extendMonths ?? 1;
      await extendRestaurantSubscription(String(restaurant._id), months);
    }
  }
  if (typeof input.note === "string") {
    payment.note = input.note;
  }

  await payment.save();

  await logActivity({
    actorUserId: actor._id,
    actorRole: actor.role,
    restaurantId: restaurant._id,
    action: "payment.updated",
    targetType: "platform_payment",
    targetId: String(payment._id),
    message: `Төлбөрийн төлөв шинэчлэгдлээ: ${payment.status}`,
  });

  return serializePayment({
    ...payment.toObject(),
    restaurantName: restaurant.name,
  });
}

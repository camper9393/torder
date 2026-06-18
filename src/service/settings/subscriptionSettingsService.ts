import mongoServer from "@/config/mongoConfig";
import { Restaurant } from "@/model/restaurant";
import { serializeSubscriptionOverview } from "@/utils/settingsSerialize";
import { Types } from "mongoose";

export async function getSubscriptionOverview(restaurantId: Types.ObjectId) {
  await mongoServer();
  const restaurant = await Restaurant.findById(restaurantId)
    .select("plan subscriptionStatus startDate expireDate")
    .lean();

  if (!restaurant) {
    return {
      currentPlan: "Basic",
      subscriptionStatus: "active",
      startDate: new Date().toISOString(),
      expireDate: new Date().toISOString(),
      lastPaymentDate: null,
      nextPaymentDate: null,
      remainingDays: 0,
      paymentHistory: [],
    };
  }

  const overview = serializeSubscriptionOverview(restaurant);

  return {
    ...overview,
    paymentHistory: [
      {
        date: overview.startDate,
        amount: 0,
        invoiceNumber: "MOCK-0001",
        status: "paid",
      },
    ],
  };
}

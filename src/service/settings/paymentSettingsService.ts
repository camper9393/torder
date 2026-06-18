import mongoServer from "@/config/mongoConfig";
import {
  PaymentSettings,
  PAYMENT_DEFAULT_INTEGRATIONS,
  PAYMENT_DEFAULT_METHODS,
} from "@/model/paymentSettings";
import { serializePaymentSettings } from "@/utils/settingsSerialize";
import { Types } from "mongoose";

export async function getOrCreatePaymentSettings(restaurantId: Types.ObjectId) {
  await mongoServer();

  const doc = await PaymentSettings.findOneAndUpdate(
    { restaurantId },
    {
      $setOnInsert: {
        restaurantId,
        methods: { ...PAYMENT_DEFAULT_METHODS },
        integrations: [...PAYMENT_DEFAULT_INTEGRATIONS],
      },
    },
    { upsert: true, new: true, lean: true }
  );

  return serializePaymentSettings({
    ...doc,
    restaurantId: doc?.restaurantId ?? restaurantId,
  });
}

export async function updatePaymentSettings(
  restaurantId: Types.ObjectId,
  input: {
    methods?: Record<string, { enabled?: boolean; label?: string }>;
    integrations?: { key: string; enabled?: boolean }[];
  }
) {
  await mongoServer();
  const current = await getOrCreatePaymentSettings(restaurantId);

  const methods = { ...current.methods };
  if (input.methods) {
    for (const [key, value] of Object.entries(input.methods)) {
      if (methods[key as keyof typeof methods]) {
        methods[key as keyof typeof methods] = {
          ...methods[key as keyof typeof methods],
          ...value,
        };
      }
    }
  }

  let integrations = [...current.integrations];
  if (input.integrations) {
    integrations = integrations.map((item) => {
      const patch = input.integrations!.find((i) => i.key === item.key);
      if (!patch) return item;
      return { ...item, enabled: patch.enabled ?? item.enabled };
    });
  }

  const doc = await PaymentSettings.findOneAndUpdate(
    { restaurantId },
    { $set: { methods, integrations } },
    { new: true, lean: true }
  );

  return doc
    ? serializePaymentSettings({
        ...doc,
        restaurantId: doc.restaurantId ?? restaurantId,
      })
    : null;
}

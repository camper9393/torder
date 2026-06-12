import mongoServer from "@/config/mongoConfig";
import { PlatformSettings } from "@/model/platformSettings";
import { RestaurantPlan } from "@/model/restaurant";
import { serializePlatformSettings } from "@/utils/platformSerialize";

export async function getOrCreatePlatformSettings() {
  await mongoServer();
  let settings = await PlatformSettings.findOne().lean();
  if (!settings) {
    const created = await PlatformSettings.create({});
    settings = created.toObject();
  }
  return serializePlatformSettings(settings);
}

export type UpdatePlatformSettingsInput = {
  platformName?: string;
  supportEmail?: string;
  defaultTrialDays?: number;
  defaultMaxTables?: number;
  defaultMaxUsers?: number;
  defaultPlan?: RestaurantPlan;
  currency?: string;
};

export async function updatePlatformSettings(input: UpdatePlatformSettingsInput) {
  await mongoServer();
  let doc = await PlatformSettings.findOne();
  if (!doc) {
    doc = await PlatformSettings.create({});
  }

  if (typeof input.platformName === "string") {
    doc.platformName = input.platformName.trim() || "TOrderPro";
  }
  if (typeof input.supportEmail === "string") {
    doc.supportEmail = input.supportEmail.trim().toLowerCase();
  }
  if (typeof input.defaultTrialDays === "number" && input.defaultTrialDays > 0) {
    doc.defaultTrialDays = input.defaultTrialDays;
  }
  if (typeof input.defaultMaxTables === "number" && input.defaultMaxTables > 0) {
    doc.defaultMaxTables = input.defaultMaxTables;
  }
  if (typeof input.defaultMaxUsers === "number" && input.defaultMaxUsers > 0) {
    doc.defaultMaxUsers = input.defaultMaxUsers;
  }
  if (input.defaultPlan && Object.values(RestaurantPlan).includes(input.defaultPlan)) {
    doc.defaultPlan = input.defaultPlan;
  }
  if (typeof input.currency === "string") {
    doc.currency = input.currency.trim() || "MNT";
  }

  await doc.save();
  return serializePlatformSettings(doc.toObject());
}

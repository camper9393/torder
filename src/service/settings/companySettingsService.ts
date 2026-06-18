import mongoServer from "@/config/mongoConfig";
import { CompanySettings } from "@/model/companySettings";
import { Restaurant } from "@/model/restaurant";
import { serializeCompanySettings } from "@/utils/settingsSerialize";
import { Types } from "mongoose";

const COMPANY_FIELDS = [
  "nameMn",
  "nameEn",
  "logoUrl",
  "businessType",
  "introduction",
  "description",
  "phone1",
  "phone2",
  "email",
  "website",
  "facebook",
  "instagram",
  "address",
  "googleMapLink",
] as const;

export async function getOrCreateCompanySettings(restaurantId: Types.ObjectId) {
  await mongoServer();

  let doc = await CompanySettings.findOne({ restaurantId }).lean();
  if (!doc) {
    const restaurant = await Restaurant.findById(restaurantId)
      .select("name email phone address")
      .lean();
    const created = await CompanySettings.create({
      restaurantId,
      nameMn: restaurant?.name ?? "",
      email: restaurant?.email ?? "",
      phone1: restaurant?.phone ?? "",
      address: restaurant?.address ?? "",
    });
    doc = created.toObject();
  }

  return serializeCompanySettings(doc);
}

export async function updateCompanySettings(
  restaurantId: Types.ObjectId,
  input: Partial<Record<(typeof COMPANY_FIELDS)[number], string>>
) {
  await mongoServer();
  await getOrCreateCompanySettings(restaurantId);

  const update: Record<string, string> = {};
  for (const key of COMPANY_FIELDS) {
    if (typeof input[key] === "string") {
      update[key] = input[key]!.trim();
    }
  }

  const doc = await CompanySettings.findOneAndUpdate(
    { restaurantId },
    { $set: update },
    { new: true }
  ).lean();

  return doc ? serializeCompanySettings(doc) : null;
}

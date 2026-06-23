import mongoServer from "@/config/mongoConfig";
import { CompanySettings } from "@/model/companySettings";
import { Restaurant } from "@/model/restaurant";
import {
  COMPANY_SETTINGS_FIELD_KEYS,
  companyInputToRestaurantUpdate,
  legacyCompanyToRestaurantPatch,
  pickCompanySettingsInput,
  restaurantToCompanyDto,
} from "@/utils/restaurantProfileMap";
import { Types } from "mongoose";

async function loadRestaurantProfileDoc(restaurantId: Types.ObjectId) {
  await mongoServer();

  let restaurant = await Restaurant.findById(restaurantId).lean();
  if (!restaurant) {
    return null;
  }

  const legacy = await CompanySettings.findOne({ restaurantId }).lean();
  if (legacy) {
    const patch = legacyCompanyToRestaurantPatch(restaurant, legacy);
    if (Object.keys(patch).length > 0) {
      restaurant = await Restaurant.findByIdAndUpdate(
        restaurantId,
        { $set: patch },
        { new: true }
      ).lean();
    }
  }

  return restaurant;
}

export async function getOrCreateCompanySettings(restaurantId: Types.ObjectId) {
  const restaurant = await loadRestaurantProfileDoc(restaurantId);
  if (!restaurant) {
    throw new Error("Ресторан олдсонгүй");
  }

  return restaurantToCompanyDto(restaurant);
}

export async function updateCompanySettings(
  restaurantId: Types.ObjectId,
  input: Record<string, unknown>
) {
  await mongoServer();

  const picked = pickCompanySettingsInput(input);
  const hasFieldUpdate = COMPANY_SETTINGS_FIELD_KEYS.some(
    (key) => typeof picked[key] === "string"
  );

  if (!hasFieldUpdate) {
    throw new Error("Хадгалах өөрчлөлт олдсонгүй");
  }

  const update = companyInputToRestaurantUpdate(picked);
  if (Object.keys(update).length === 0) {
    throw new Error("Хадгалах өөрчлөлт олдсонгүй");
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw new Error("Ресторан олдсонгүй");
  }

  restaurant.set(update);
  await restaurant.save();

  return restaurantToCompanyDto(restaurant.toObject());
}

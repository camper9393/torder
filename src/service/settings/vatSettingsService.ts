import mongoServer from "@/config/mongoConfig";
import { VatSettings } from "@/model/vatSettings";
import { serializeVatSettings } from "@/utils/settingsSerialize";
import { Types } from "mongoose";

const VAT_INSERT_DEFAULTS = {
  companyName: "",
  registrationNumber: "",
  isVatPayer: false,
  taxPayerCode: "",
  ebarimtMerchantCode: "",
  vatEnabled: false,
};

export async function getOrCreateVatSettings(restaurantId: Types.ObjectId) {
  await mongoServer();

  const doc = await VatSettings.findOneAndUpdate(
    { restaurantId },
    {
      $setOnInsert: {
        restaurantId,
        ...VAT_INSERT_DEFAULTS,
      },
    },
    { upsert: true, new: true, lean: true }
  );

  return serializeVatSettings({
    ...doc,
    restaurantId: doc?.restaurantId ?? restaurantId,
  });
}

export async function updateVatSettings(
  restaurantId: Types.ObjectId,
  input: Partial<{
    companyName: string;
    registrationNumber: string;
    isVatPayer: boolean;
    taxPayerCode: string;
    ebarimtMerchantCode: string;
    vatEnabled: boolean;
  }>
) {
  await mongoServer();
  await getOrCreateVatSettings(restaurantId);

  const update: Record<string, unknown> = {};
  if (typeof input.companyName === "string")
    update.companyName = input.companyName.trim();
  if (typeof input.registrationNumber === "string")
    update.registrationNumber = input.registrationNumber.trim();
  if (typeof input.isVatPayer === "boolean") update.isVatPayer = input.isVatPayer;
  if (typeof input.taxPayerCode === "string")
    update.taxPayerCode = input.taxPayerCode.trim();
  if (typeof input.ebarimtMerchantCode === "string")
    update.ebarimtMerchantCode = input.ebarimtMerchantCode.trim();
  if (typeof input.vatEnabled === "boolean") update.vatEnabled = input.vatEnabled;

  const doc = await VatSettings.findOneAndUpdate(
    { restaurantId },
    { $set: update },
    { new: true, lean: true }
  );

  return doc
    ? serializeVatSettings({
        ...doc,
        restaurantId: doc.restaurantId ?? restaurantId,
      })
    : null;
}

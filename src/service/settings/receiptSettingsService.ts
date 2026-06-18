import mongoServer from "@/config/mongoConfig";
import { ReceiptSettings } from "@/model/receiptSettings";
import { serializeReceiptSettings } from "@/utils/settingsSerialize";
import { Types } from "mongoose";

const RECEIPT_INSERT_DEFAULTS = {
  logoUrl: "",
  headerText: "",
  footerText: "",
  thankYouMessage: "Баярлалаа! Дахин тавтай морилно уу.",
  additionalInfo: "",
  receiptSize: "80mm" as const,
  fontSize: 12,
  printQuantity: false,
  showLogo: true,
  showCustomerInfo: false,
  showDeliveryQr: false,
  showPaymentMethod: true,
  showAddressPhone: true,
  showStaffName: false,
  ebarimtQrOnly: false,
  showAddress: true,
  showPhone: true,
};

type ReceiptUpdateInput = Partial<{
  logoUrl: string;
  headerText: string;
  footerText: string;
  thankYouMessage: string;
  additionalInfo: string;
  receiptSize: "80mm" | "58mm";
  fontSize: 10 | 12 | 14;
  printQuantity: boolean;
  showLogo: boolean;
  showCustomerInfo: boolean;
  showDeliveryQr: boolean;
  showPaymentMethod: boolean;
  showAddressPhone: boolean;
  showStaffName: boolean;
  ebarimtQrOnly: boolean;
  showAddress: boolean;
  showPhone: boolean;
}>;

export async function getOrCreateReceiptSettings(restaurantId: Types.ObjectId) {
  await mongoServer();

  const doc = await ReceiptSettings.findOneAndUpdate(
    { restaurantId },
    {
      $setOnInsert: {
        restaurantId,
        ...RECEIPT_INSERT_DEFAULTS,
      },
    },
    { upsert: true, new: true, lean: true }
  );

  return serializeReceiptSettings({
    ...doc,
    restaurantId: doc?.restaurantId ?? restaurantId,
  });
}

export async function updateReceiptSettings(
  restaurantId: Types.ObjectId,
  input: ReceiptUpdateInput
) {
  await mongoServer();
  await getOrCreateReceiptSettings(restaurantId);

  const update: Record<string, unknown> = {};

  if (typeof input.logoUrl === "string") update.logoUrl = input.logoUrl.trim();
  if (typeof input.headerText === "string")
    update.headerText = input.headerText.trim();
  if (typeof input.thankYouMessage === "string")
    update.thankYouMessage = input.thankYouMessage.trim();

  const additionalInfo =
    typeof input.additionalInfo === "string"
      ? input.additionalInfo.trim()
      : typeof input.footerText === "string"
        ? input.footerText.trim()
        : undefined;

  if (additionalInfo !== undefined) {
    update.additionalInfo = additionalInfo;
    update.footerText = additionalInfo;
  }

  if (input.receiptSize === "80mm" || input.receiptSize === "58mm") {
    update.receiptSize = input.receiptSize;
  }

  if (input.fontSize === 10 || input.fontSize === 12 || input.fontSize === 14) {
    update.fontSize = input.fontSize;
  }

  const boolFields = [
    "printQuantity",
    "showLogo",
    "showCustomerInfo",
    "showDeliveryQr",
    "showPaymentMethod",
    "showStaffName",
    "ebarimtQrOnly",
  ] as const;

  for (const key of boolFields) {
    if (typeof input[key] === "boolean") update[key] = input[key];
  }

  if (typeof input.showAddressPhone === "boolean") {
    update.showAddressPhone = input.showAddressPhone;
    update.showAddress = input.showAddressPhone;
    update.showPhone = input.showAddressPhone;
  } else {
    if (typeof input.showAddress === "boolean") {
      update.showAddress = input.showAddress;
    }
    if (typeof input.showPhone === "boolean") {
      update.showPhone = input.showPhone;
    }
    if (
      typeof input.showAddress === "boolean" ||
      typeof input.showPhone === "boolean"
    ) {
      const address =
        typeof input.showAddress === "boolean" ? input.showAddress : true;
      const phone = typeof input.showPhone === "boolean" ? input.showPhone : true;
      update.showAddressPhone = address && phone;
    }
  }

  const doc = await ReceiptSettings.findOneAndUpdate(
    { restaurantId },
    { $set: update },
    { new: true, lean: true }
  );

  return doc
    ? serializeReceiptSettings({
        ...doc,
        restaurantId: doc.restaurantId ?? restaurantId,
      })
    : null;
}

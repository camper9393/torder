import type { IBranch } from "@/model/branch";
import type { ICompanySettings } from "@/model/companySettings";
import type { IPaymentSettings } from "@/model/paymentSettings";
import {
  PAYMENT_DEFAULT_INTEGRATIONS,
  PAYMENT_DEFAULT_METHODS,
} from "@/model/paymentSettings";
import type { IReceiptSettings } from "@/model/receiptSettings";
import type { IVatSettings } from "@/model/vatSettings";
import type { IActivityLog } from "@/model/activityLog";
import type { IRestaurant } from "@/model/restaurant";

function toIso(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}

export function serializeCompanySettings(doc: ICompanySettings) {
  return {
    _id: String(doc._id),
    restaurantId: String(doc.restaurantId),
    nameMn: doc.nameMn,
    nameEn: doc.nameEn,
    logoUrl: doc.logoUrl,
    businessType: doc.businessType,
    introduction: doc.introduction,
    description: doc.description,
    phone1: doc.phone1,
    phone2: doc.phone2,
    email: doc.email,
    website: doc.website,
    facebook: doc.facebook,
    instagram: doc.instagram,
    address: doc.address,
    googleMapLink: doc.googleMapLink,
    updatedAt: toIso(doc.updatedAt)!,
  };
}

export function serializeBranch(doc: IBranch) {
  return {
    _id: String(doc._id),
    restaurantId: String(doc.restaurantId),
    name: doc.name,
    address: doc.address,
    phone: doc.phone,
    email: doc.email,
    manager: doc.manager,
    description: doc.description,
    status: doc.status,
    createdAt: toIso(doc.createdAt)!,
    updatedAt: toIso(doc.updatedAt)!,
  };
}

export function serializePaymentSettings(
  doc: Partial<IPaymentSettings> & { restaurantId: unknown; _id?: unknown }
) {
  return {
    _id: doc._id ? String(doc._id) : undefined,
    restaurantId: String(doc.restaurantId),
    methods: {
      ...PAYMENT_DEFAULT_METHODS,
      ...(doc.methods ?? {}),
    },
    integrations:
      Array.isArray(doc.integrations) && doc.integrations.length > 0
        ? doc.integrations
        : [...PAYMENT_DEFAULT_INTEGRATIONS],
    updatedAt: toIso(doc.updatedAt)!,
  };
}

export function serializeReceiptSettings(
  doc: Partial<IReceiptSettings> & { restaurantId: unknown; _id?: unknown }
) {
  const showAddressPhone =
    typeof doc.showAddressPhone === "boolean"
      ? doc.showAddressPhone
      : (doc.showAddress ?? true) && (doc.showPhone ?? true);

  const additionalInfo =
    doc.additionalInfo?.trim() || doc.footerText?.trim() || "";

  const fontSize =
    doc.fontSize === 10 || doc.fontSize === 12 || doc.fontSize === 14
      ? doc.fontSize
      : 12;

  return {
    _id: doc._id ? String(doc._id) : undefined,
    restaurantId: String(doc.restaurantId),
    logoUrl: doc.logoUrl ?? "",
    headerText: doc.headerText ?? "",
    footerText: additionalInfo,
    thankYouMessage:
      doc.thankYouMessage ?? "Баярлалаа! Дахин тавтай морилно уу.",
    additionalInfo,
    receiptSize: doc.receiptSize === "58mm" ? "58mm" : "80mm",
    fontSize,
    printQuantity: doc.printQuantity ?? false,
    showLogo: doc.showLogo ?? true,
    showCustomerInfo: doc.showCustomerInfo ?? false,
    showDeliveryQr: doc.showDeliveryQr ?? false,
    showPaymentMethod: doc.showPaymentMethod ?? true,
    showAddressPhone,
    showStaffName: doc.showStaffName ?? false,
    ebarimtQrOnly: doc.ebarimtQrOnly ?? false,
    showAddress: showAddressPhone,
    showPhone: showAddressPhone,
    updatedAt: toIso(doc.updatedAt)!,
  };
}

export function serializeVatSettings(
  doc: Partial<IVatSettings> & { restaurantId: unknown; _id?: unknown }
) {
  return {
    _id: doc._id ? String(doc._id) : undefined,
    restaurantId: String(doc.restaurantId),
    companyName: doc.companyName ?? "",
    registrationNumber: doc.registrationNumber ?? "",
    isVatPayer: doc.isVatPayer ?? false,
    taxPayerCode: doc.taxPayerCode ?? "",
    ebarimtMerchantCode: doc.ebarimtMerchantCode ?? "",
    vatEnabled: doc.vatEnabled ?? false,
    updatedAt: toIso(doc.updatedAt)!,
  };
}

export function serializeMerchantActivity(
  doc: IActivityLog & { actorName?: string }
) {
  return {
    _id: String(doc._id),
    actorUserId: doc.actorUserId ? String(doc.actorUserId) : undefined,
    actorName: doc.actorName,
    actorRole: doc.actorRole,
    restaurantId: doc.restaurantId ? String(doc.restaurantId) : undefined,
    action: doc.action,
    module: doc.module,
    targetType: doc.targetType,
    targetId: doc.targetId,
    message: doc.message,
    oldValue: doc.oldValue,
    newValue: doc.newValue,
    ipAddress: doc.ipAddress,
    device: doc.device,
    metadata: doc.metadata ?? {},
    createdAt: toIso(doc.createdAt)!,
  };
}

export function serializeSubscriptionOverview(
  restaurant: Pick<
    IRestaurant,
    "plan" | "subscriptionStatus" | "startDate" | "expireDate"
  >
) {
  const now = new Date();
  const expire = new Date(restaurant.expireDate);
  const remainingDays = Math.max(
    0,
    Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const planMap: Record<string, string> = {
    starter: "Trial",
    business: "Standard",
    enterprise: "Premium",
  };

  return {
    currentPlan: planMap[restaurant.plan] ?? restaurant.plan,
    subscriptionStatus: restaurant.subscriptionStatus,
    startDate: toIso(restaurant.startDate)!,
    expireDate: toIso(restaurant.expireDate)!,
    lastPaymentDate: null as string | null,
    nextPaymentDate: toIso(restaurant.expireDate)!,
    remainingDays,
    paymentHistory: [] as {
      date: string;
      amount: number;
      invoiceNumber: string;
      status: string;
    }[],
  };
}

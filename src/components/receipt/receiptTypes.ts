import type { ReceiptFontSize, ReceiptSize } from "@/model/receiptSettings";

export type ReceiptData = {
  logoUrl: string;
  headerText: string;
  footerText: string;
  thankYouMessage: string;
  additionalInfo: string;
  receiptSize: ReceiptSize;
  fontSize: ReceiptFontSize;
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
};

export const RECEIPT_FORM_DEFAULTS: ReceiptData = {
  logoUrl: "",
  headerText: "",
  footerText: "",
  thankYouMessage: "Баярлалаа! Дахин тавтай морилно уу.",
  additionalInfo: "",
  receiptSize: "80mm",
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

export function normalizeReceiptData(
  payload?: Partial<ReceiptData> | null
): ReceiptData {
  const merged = { ...RECEIPT_FORM_DEFAULTS, ...(payload ?? {}) };

  const receiptSize: ReceiptSize =
    merged.receiptSize === "58mm" ? "58mm" : "80mm";
  const fontSize: ReceiptFontSize = [10, 12, 14].includes(
    merged.fontSize as ReceiptFontSize
  )
    ? (merged.fontSize as ReceiptFontSize)
    : 12;

  const showAddressPhone =
    typeof merged.showAddressPhone === "boolean"
      ? merged.showAddressPhone
      : Boolean(merged.showAddress && merged.showPhone);

  const additionalInfo =
    merged.additionalInfo?.trim() || merged.footerText?.trim() || "";

  return {
    ...merged,
    receiptSize,
    fontSize,
    showAddressPhone,
    showAddress: showAddressPhone,
    showPhone: showAddressPhone,
    additionalInfo,
    footerText: additionalInfo || merged.footerText || "",
  };
}

export const RECEIPT_TOGGLE_OPTIONS: {
  key: keyof Pick<
    ReceiptData,
    | "printQuantity"
    | "showLogo"
    | "showCustomerInfo"
    | "showDeliveryQr"
    | "showPaymentMethod"
    | "showAddressPhone"
    | "showStaffName"
    | "ebarimtQrOnly"
  >;
  label: string;
}[] = [
  { key: "printQuantity", label: "Нэмэлт хувь хэвлэх" },
  { key: "showLogo", label: "Лого хэвлэх" },
  { key: "showCustomerInfo", label: "Худалдан авагчийн мэдээлэл хэвлэх" },
  { key: "showDeliveryQr", label: "Хүргэлтийн QR хэвлэх" },
  { key: "showPaymentMethod", label: "Төлбөрийн хэрэгсэл хэвлэх" },
  { key: "showAddressPhone", label: "Хаяг болон утас хэвлэх" },
  { key: "showStaffName", label: "Ажилтны нэр хэвлэх" },
  { key: "ebarimtQrOnly", label: "Зөвхөн E-Barimt QR харуулах" },
];

export type { ReceiptCompanyInfo, ReceiptContactInfo } from "@/components/receipt/receiptCompany";
export {
  RECEIPT_COMPANY_DEFAULTS,
  RECEIPT_CONTACT_DEFAULTS,
} from "@/components/receipt/receiptCompany";

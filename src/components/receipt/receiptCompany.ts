import type { ReceiptData } from "@/components/receipt/receiptTypes";

export const EMPTY_INFO_LABEL = "Мэдээлэл оруулаагүй";

export type ReceiptCompanyInfo = {
  name: string;
  address: string;
  phone: string;
  phone2: string;
  logoUrl: string;
};

export const RECEIPT_COMPANY_DEFAULTS: ReceiptCompanyInfo = {
  name: "",
  address: "",
  phone: "",
  phone2: "",
  logoUrl: "",
};

/** @deprecated use ReceiptCompanyInfo */
export type ReceiptContactInfo = Pick<ReceiptCompanyInfo, "address" | "phone">;

export const RECEIPT_CONTACT_DEFAULTS: ReceiptContactInfo = {
  address: "",
  phone: "",
};

export function formatCompanyPhone(phone: string, phone2?: string): string {
  const primary = phone.trim();
  const secondary = (phone2 ?? "").trim();
  if (primary && secondary) return `${primary}, ${secondary}`;
  return primary || secondary;
}

export function resolveReceiptCompanyFields({
  company,
  settings,
  fallbackName = "",
}: {
  company: ReceiptCompanyInfo;
  settings: ReceiptData;
  fallbackName?: string;
}): {
  restaurantName: string;
  address: string;
  phone: string;
  logoUrl: string;
} {
  const name =
    settings.headerText.trim() ||
    company.name.trim() ||
    fallbackName.trim();

  const address = company.address.trim();
  const phone = formatCompanyPhone(company.phone, company.phone2);
  const logoUrl = company.logoUrl.trim() || settings.logoUrl.trim();

  return {
    restaurantName: name || EMPTY_INFO_LABEL,
    address: address || EMPTY_INFO_LABEL,
    phone: phone || EMPTY_INFO_LABEL,
    logoUrl,
  };
}

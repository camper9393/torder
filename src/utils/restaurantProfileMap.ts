import type { ICompanySettings } from "@/model/companySettings";
import type { IRestaurant } from "@/model/restaurant";

/** Owner Settings API shape (unchanged for existing UI). */
export type RestaurantCompanyDto = {
  _id: string;
  restaurantId: string;
  nameMn: string;
  nameEn: string;
  logoUrl: string;
  businessType: string;
  introduction: string;
  description: string;
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  address: string;
  googleMapLink: string;
  updatedAt: string;
};

export const COMPANY_SETTINGS_FIELD_KEYS = [
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

export type CompanySettingsFieldKey =
  (typeof COMPANY_SETTINGS_FIELD_KEYS)[number];

function toIso(value: Date | string | undefined): string {
  if (!value) return new Date(0).toISOString();
  return value instanceof Date ? value.toISOString() : String(value);
}

export function restaurantToCompanyDto(
  doc: Pick<
    IRestaurant,
    | "_id"
    | "name"
    | "englishName"
    | "logoUrl"
    | "businessType"
    | "description"
    | "detailDescription"
    | "phone"
    | "phone2"
    | "email"
    | "website"
    | "facebook"
    | "instagram"
    | "address"
    | "googleMapLink"
    | "updatedAt"
  >
): RestaurantCompanyDto {
  const id = String(doc._id);
  return {
    _id: id,
    restaurantId: id,
    nameMn: doc.name ?? "",
    nameEn: doc.englishName ?? "",
    logoUrl: doc.logoUrl ?? "",
    businessType: doc.businessType ?? "",
    introduction: doc.description ?? "",
    description: doc.detailDescription ?? "",
    phone1: doc.phone ?? "",
    phone2: doc.phone2 ?? "",
    email: doc.email ?? "",
    website: doc.website ?? "",
    facebook: doc.facebook ?? "",
    instagram: doc.instagram ?? "",
    address: doc.address ?? "",
    googleMapLink: doc.googleMapLink ?? "",
    updatedAt: toIso(doc.updatedAt),
  };
}

export function pickCompanySettingsInput(
  body: Record<string, unknown>
): Partial<Record<CompanySettingsFieldKey, string>> {
  const picked: Partial<Record<CompanySettingsFieldKey, string>> = {};
  for (const key of COMPANY_SETTINGS_FIELD_KEYS) {
    const value = body[key];
    if (typeof value === "string") {
      picked[key] = value;
    }
  }
  return picked;
}

export function companyInputToRestaurantUpdate(
  input: Partial<Record<CompanySettingsFieldKey, string>>
): Partial<
  Pick<
    IRestaurant,
    | "name"
    | "englishName"
    | "logoUrl"
    | "businessType"
    | "description"
    | "detailDescription"
    | "phone"
    | "phone2"
    | "email"
    | "website"
    | "facebook"
    | "instagram"
    | "address"
    | "googleMapLink"
  >
> {
  const update: Partial<
    Pick<
      IRestaurant,
      | "name"
      | "englishName"
      | "logoUrl"
      | "businessType"
      | "description"
      | "detailDescription"
      | "phone"
      | "phone2"
      | "email"
      | "website"
      | "facebook"
      | "instagram"
      | "address"
      | "googleMapLink"
    >
  > = {};

  if (typeof input.nameMn === "string") {
    update.name = input.nameMn.trim();
  }
  if (typeof input.nameEn === "string") {
    update.englishName = input.nameEn.trim();
  }
  if (typeof input.logoUrl === "string") {
    update.logoUrl = input.logoUrl.trim();
  }
  if (typeof input.businessType === "string") {
    update.businessType = input.businessType.trim();
  }
  if (typeof input.introduction === "string") {
    update.description = input.introduction.trim();
  }
  if (typeof input.description === "string") {
    update.detailDescription = input.description.trim();
  }
  if (typeof input.phone1 === "string") {
    update.phone = input.phone1.trim();
  }
  if (typeof input.phone2 === "string") {
    update.phone2 = input.phone2.trim();
  }
  if (typeof input.email === "string") {
    update.email = input.email.trim().toLowerCase();
  }
  if (typeof input.website === "string") {
    update.website = input.website.trim();
  }
  if (typeof input.facebook === "string") {
    update.facebook = input.facebook.trim();
  }
  if (typeof input.instagram === "string") {
    update.instagram = input.instagram.trim();
  }
  if (typeof input.address === "string") {
    update.address = input.address.trim();
  }
  if (typeof input.googleMapLink === "string") {
    update.googleMapLink = input.googleMapLink.trim();
  }

  if (update.name === "") {
    delete update.name;
  }
  if (update.email === "") {
    delete update.email;
  }
  if (update.phone === "") {
    delete update.phone;
  }

  return update;
}

/** One-time merge from legacy company_settings into Restaurant when profile fields are empty. */
export function legacyCompanyToRestaurantPatch(
  restaurant: Pick<
    IRestaurant,
    | "englishName"
    | "logoUrl"
    | "businessType"
    | "description"
    | "detailDescription"
    | "phone2"
    | "website"
    | "facebook"
    | "instagram"
    | "googleMapLink"
  >,
  legacy: Pick<
    ICompanySettings,
    | "nameEn"
    | "logoUrl"
    | "businessType"
    | "introduction"
    | "description"
    | "phone2"
    | "website"
    | "facebook"
    | "instagram"
    | "googleMapLink"
  >
): Partial<IRestaurant> {
  const patch: Partial<IRestaurant> = {};

  if (!restaurant.englishName?.trim() && legacy.nameEn?.trim()) {
    patch.englishName = legacy.nameEn.trim();
  }
  if (!restaurant.logoUrl?.trim() && legacy.logoUrl?.trim()) {
    patch.logoUrl = legacy.logoUrl.trim();
  }
  if (!restaurant.businessType?.trim() && legacy.businessType?.trim()) {
    patch.businessType = legacy.businessType.trim();
  }
  if (!restaurant.description?.trim() && legacy.introduction?.trim()) {
    patch.description = legacy.introduction.trim();
  }
  if (!restaurant.detailDescription?.trim() && legacy.description?.trim()) {
    patch.detailDescription = legacy.description.trim();
  }
  if (!restaurant.phone2?.trim() && legacy.phone2?.trim()) {
    patch.phone2 = legacy.phone2.trim();
  }
  if (!restaurant.website?.trim() && legacy.website?.trim()) {
    patch.website = legacy.website.trim();
  }
  if (!restaurant.facebook?.trim() && legacy.facebook?.trim()) {
    patch.facebook = legacy.facebook.trim();
  }
  if (!restaurant.instagram?.trim() && legacy.instagram?.trim()) {
    patch.instagram = legacy.instagram.trim();
  }
  if (!restaurant.googleMapLink?.trim() && legacy.googleMapLink?.trim()) {
    patch.googleMapLink = legacy.googleMapLink.trim();
  }

  return patch;
}

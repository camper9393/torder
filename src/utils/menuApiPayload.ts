import {
  buildMenuDbFields,
  parseSizesJson,
  resolveMenuPrice,
  sizesFromFormRows,
  type BilingualMenuSize,
} from "@/utils/menuBilingual";
import { parseSpicyLevel, parseSpicyValue, spicyLevelToDbFields } from "@/utils/menuSpicy";

export type ParsedMenuBody = {
  nameMn: string;
  nameEn: string;
  descriptionMn: string;
  descriptionEn: string;
  section: string;
  price: number;
  sizes?: BilingualMenuSize[];
  available: boolean;
  spicyLevel: number;
};

function parseAvailable(value: unknown): boolean | null {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return null;
}

function readSpicyLevel(
  spicyLevelRaw: unknown,
  spicyRaw: unknown
): number | null {
  let spicyLevel = parseSpicyLevel(spicyLevelRaw);
  if (spicyLevel === null && spicyRaw !== null && spicyRaw !== undefined) {
    const legacy = parseSpicyValue(spicyRaw);
    if (legacy !== null) spicyLevel = legacy ? 1 : 0;
  }
  return spicyLevel;
}

export function parseMenuBodyFromFormData(
  formData: FormData
): { body: ParsedMenuBody | null; error?: string } {
  const nameMn = String(formData.get("nameMn") || "").trim();
  const nameEn = String(formData.get("nameEn") || "").trim();
  const descriptionMn = String(formData.get("descriptionMn") || "").trim();
  const descriptionEn = String(formData.get("descriptionEn") || "").trim();
  const section = String(formData.get("section") || "").trim();
  const priceRaw = formData.get("price");
  const basePrice = Number(priceRaw);
  const sizes = parseSizesJson(formData.get("sizesJson"));
  const available = parseAvailable(formData.get("available")) ?? true;
  const spicyLevel = readSpicyLevel(
    formData.get("spicyLevel"),
    formData.get("spicy")
  );

  if (!nameMn && !nameEn) {
    return { body: null, error: "Mongolian or English name is required" };
  }
  if (!section) {
    return { body: null, error: "Section is required" };
  }
  if (spicyLevel === null) {
    return { body: null, error: "spicyLevel must be 0–4" };
  }

  const price = resolveMenuPrice(
    Number.isNaN(basePrice) ? 0 : basePrice,
    sizes
  );

  if (!sizes?.length && (Number.isNaN(basePrice) || basePrice < 0)) {
    return { body: null, error: "Valid price is required when no sizes" };
  }

  if (sizes?.length && price < 0) {
    return { body: null, error: "Each size needs a valid price" };
  }

  return {
    body: {
      nameMn: nameMn || nameEn,
      nameEn,
      descriptionMn,
      descriptionEn,
      section,
      price: sizes?.length ? price : basePrice,
      sizes,
      available,
      spicyLevel,
    },
  };
}

export function menuBodyToDbSet(
  body: ParsedMenuBody
): Record<string, unknown> {
  return {
    ...buildMenuDbFields({
      nameMn: body.nameMn,
      nameEn: body.nameEn,
      descriptionMn: body.descriptionMn,
      descriptionEn: body.descriptionEn,
      section: body.section,
      price: body.price,
      sizes: body.sizes,
      available: body.available,
      spicyLevel: body.spicyLevel,
    }),
    ...spicyLevelToDbFields(body.spicyLevel),
  };
}

export { sizesFromFormRows };

import mongoose from "mongoose";

export type MenuSizeOption = {
  labelMn?: string;
  labelEn?: string;
  label?: string;
  price: number;
};

export interface IMenu {
  _id: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  image: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  originalPrice?: number;
  section: string;
  spicy?: boolean;
  spicyLevel?: number;
  available?: boolean;
  nameMn?: string;
  nameEn?: string;
  descriptionMn?: string;
  descriptionEn?: string;
  nameMongolian?: string;
  nameEnglish?: string;
  descriptionMongolian?: string;
  descriptionEnglish?: string;
  sizes?: MenuSizeOption[];
  createdAt: Date;
  updatedAt: Date;
}

const menuSizeSchema = new mongoose.Schema<MenuSizeOption>(
  {
    labelMn: { type: String, trim: true },
    labelEn: { type: String, trim: true },
    label: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema<IMenu>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: true,
      index: true,
    },
    image: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    originalPrice: { type: Number, min: 0 },
    section: { type: String, required: true, trim: true, index: true },
    spicy: { type: Boolean, default: false },
    spicyLevel: { type: Number, min: 0, max: 4, default: 0 },
    available: { type: Boolean, default: true },
    nameMn: { type: String, trim: true },
    nameEn: { type: String, trim: true },
    descriptionMn: { type: String, trim: true },
    descriptionEn: { type: String, trim: true },
    nameMongolian: { type: String, trim: true },
    nameEnglish: { type: String, trim: true },
    descriptionMongolian: { type: String, trim: true },
    descriptionEnglish: { type: String, trim: true },
    sizes: { type: [menuSizeSchema], default: undefined },
  },
  { timestamps: true, versionKey: false }
);

const requiredExtendedPaths = [
  "nameMn",
  "nameEn",
  "descriptionMn",
  "descriptionEn",
  "nameMongolian",
  "sizes",
] as const;

if (mongoose.models.menus) {
  const schema = mongoose.models.menus.schema;
  const missingExtended = requiredExtendedPaths.some((p) => !schema.path(p));
  if (
    !schema.path("spicy") ||
    !schema.path("spicyLevel") ||
    !schema.path("available") ||
    missingExtended
  ) {
    mongoose.deleteModel("menus");
  }
}

export const Menu =
  mongoose.models.menus || mongoose.model<IMenu>("menus", menuSchema);

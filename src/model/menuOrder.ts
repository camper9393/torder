import mongoose from "mongoose";

export interface ISectionMetaEntry {
  labelMn: string;
  labelEn: string;
}

export interface IMenuOrder {
  merchantId: mongoose.Types.ObjectId;
  sectionOrder: string[];
  itemOrders: Record<string, string[]>;
  sectionIcons: Record<string, string>;
  sectionMeta: Record<string, ISectionMetaEntry>;
  createdAt: Date;
  updatedAt: Date;
}

const menuOrderSchema = new mongoose.Schema<IMenuOrder>(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "merchants",
      required: true,
      unique: true,
      index: true,
    },
    sectionOrder: { type: [String], default: [] },
    itemOrders: { type: mongoose.Schema.Types.Mixed, default: {} },
    sectionIcons: { type: mongoose.Schema.Types.Mixed, default: {} },
    sectionMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

if (mongoose.models.menu_orders) {
  delete mongoose.models.menu_orders;
}

export const MenuOrder = mongoose.model<IMenuOrder>(
  "menu_orders",
  menuOrderSchema
);

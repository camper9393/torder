import mongoose from "mongoose";

export interface IVatSettings {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  companyName: string;
  registrationNumber: string;
  isVatPayer: boolean;
  taxPayerCode: string;
  ebarimtMerchantCode: string;
  vatEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vatSettingsSchema = new mongoose.Schema<IVatSettings>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      required: true,
      unique: true,
      index: true,
    },
    companyName: { type: String, default: "", trim: true },
    registrationNumber: { type: String, default: "", trim: true },
    isVatPayer: { type: Boolean, default: false },
    taxPayerCode: { type: String, default: "", trim: true },
    ebarimtMerchantCode: { type: String, default: "", trim: true },
    vatEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const VatSettings =
  mongoose.models.vat_settings ||
  mongoose.model<IVatSettings>("vat_settings", vatSettingsSchema);

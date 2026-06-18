import mongoose from "mongoose";

export type ReceiptSize = "80mm" | "58mm";
export type ReceiptFontSize = 10 | 12 | 14;

export interface IReceiptSettings {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
}

const receiptSettingsSchema = new mongoose.Schema<IReceiptSettings>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      required: true,
      unique: true,
      index: true,
    },
    logoUrl: { type: String, default: "", trim: true },
    headerText: { type: String, default: "", trim: true },
    footerText: { type: String, default: "", trim: true },
    thankYouMessage: {
      type: String,
      default: "Баярлалаа! Дахин тавтай морилно уу.",
      trim: true,
    },
    additionalInfo: { type: String, default: "", trim: true },
    receiptSize: {
      type: String,
      enum: ["80mm", "58mm"],
      default: "80mm",
    },
    fontSize: {
      type: Number,
      enum: [10, 12, 14],
      default: 12,
    },
    printQuantity: { type: Boolean, default: false },
    showLogo: { type: Boolean, default: true },
    showCustomerInfo: { type: Boolean, default: false },
    showDeliveryQr: { type: Boolean, default: false },
    showPaymentMethod: { type: Boolean, default: true },
    showAddressPhone: { type: Boolean, default: true },
    showStaffName: { type: Boolean, default: false },
    ebarimtQrOnly: { type: Boolean, default: false },
    showAddress: { type: Boolean, default: true },
    showPhone: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ReceiptSettings =
  mongoose.models.receipt_settings ||
  mongoose.model<IReceiptSettings>("receipt_settings", receiptSettingsSchema);

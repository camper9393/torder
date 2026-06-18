import mongoose from "mongoose";

export type PaymentMethodKey = "cash" | "card" | "qr" | "bankTransfer";

export type PaymentMethodConfig = {
  enabled: boolean;
  label: string;
};

export type PaymentIntegrationPlaceholder = {
  key: string;
  label: string;
  enabled: boolean;
  configured: boolean;
};

export interface IPaymentSettings {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  methods: Record<PaymentMethodKey, PaymentMethodConfig>;
  integrations: PaymentIntegrationPlaceholder[];
  createdAt: Date;
  updatedAt: Date;
}

const defaultMethods: Record<PaymentMethodKey, PaymentMethodConfig> = {
  cash: { enabled: true, label: "Бэлэн мөнгө" },
  card: { enabled: true, label: "Карт" },
  qr: { enabled: false, label: "QR төлбөр" },
  bankTransfer: { enabled: false, label: "Банк шилжүүлэг" },
};

const defaultIntegrations: PaymentIntegrationPlaceholder[] = [
  { key: "khan_pos", label: "Khan Bank POS", enabled: false, configured: false },
  { key: "golomt_pos", label: "Golomt POS", enabled: false, configured: false },
  { key: "tdb_pos", label: "TDB POS", enabled: false, configured: false },
  { key: "socialpay", label: "SocialPay", enabled: false, configured: false },
  { key: "qpay", label: "QPay", enabled: false, configured: false },
];

const paymentIntegrationSchema = new mongoose.Schema<PaymentIntegrationPlaceholder>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    configured: { type: Boolean, default: false },
  },
  { _id: false }
);

const paymentSettingsSchema = new mongoose.Schema<IPaymentSettings>(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "restaurants",
      required: true,
      unique: true,
      index: true,
    },
    methods: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({ ...defaultMethods }),
    },
    integrations: {
      type: [paymentIntegrationSchema],
      default: () => [...defaultIntegrations],
    },
  },
  { timestamps: true }
);

export {
  defaultIntegrations as PAYMENT_DEFAULT_INTEGRATIONS,
  defaultMethods as PAYMENT_DEFAULT_METHODS,
};

export const PaymentSettings =
  mongoose.models.payment_settings ||
  mongoose.model<IPaymentSettings>("payment_settings", paymentSettingsSchema);

type MethodConfig = { enabled: boolean; label: string };
type Integration = {
  key: string;
  label: string;
  enabled: boolean;
  configured: boolean;
};

export const PAYMENT_SETTINGS_DEFAULTS: {
  methods: Record<string, MethodConfig>;
  integrations: Integration[];
} = {
  methods: {
    cash: { enabled: true, label: "Бэлэн мөнгө" },
    card: { enabled: true, label: "Карт" },
    qr: { enabled: false, label: "QR төлбөр" },
    bankTransfer: { enabled: false, label: "Банк шилжүүлэг" },
  },
  integrations: [
    { key: "khan_pos", label: "Khan Bank POS", enabled: false, configured: false },
    { key: "golomt_pos", label: "Golomt POS", enabled: false, configured: false },
    { key: "tdb_pos", label: "TDB POS", enabled: false, configured: false },
    { key: "socialpay", label: "SocialPay", enabled: false, configured: false },
    { key: "qpay", label: "QPay", enabled: false, configured: false },
  ],
};

export const RECEIPT_SETTINGS_DEFAULTS = {
  logoUrl: "",
  headerText: "",
  footerText: "",
  thankYouMessage: "Баярлалаа! Дахин тавтай морилно уу.",
  additionalInfo: "",
  receiptSize: "80mm" as const,
  fontSize: 12 as const,
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

export const VAT_SETTINGS_DEFAULTS = {
  companyName: "",
  registrationNumber: "",
  isVatPayer: false,
  taxPayerCode: "",
  ebarimtMerchantCode: "",
  vatEnabled: false,
};

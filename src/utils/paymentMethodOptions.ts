import { PAYMENT_SETTINGS_DEFAULTS } from "@/components/Admin/Settings/settingsDefaults";

export type PaymentMethodOption = {
  id: string;
  label: string;
  isCash: boolean;
  isQPay: boolean;
};

export type PaymentSettingsSource = {
  methods: Record<string, { enabled?: boolean; label?: string }>;
  integrations: Array<{ key: string; label: string; enabled?: boolean }>;
};

const CORE_METHOD_MODAL_MAP: Record<
  string,
  { label: string; isCash?: boolean; isQPay?: boolean }
> = {
  cash: { label: "Бэлэн", isCash: true },
  card: { label: "Карт" },
  bankTransfer: { label: "Данс" },
  qr: { label: "QPay", isQPay: true },
};

/** API алдаатай үед зөвхөн бэлэн мөнгө */
export const FALLBACK_PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { id: "method:cash", label: "Бэлэн", isCash: true, isQPay: false },
];

export function buildEnabledPaymentMethodOptions(
  settings: PaymentSettingsSource
): PaymentMethodOption[] {
  const options: PaymentMethodOption[] = [];
  let qPayAdded = false;

  for (const [key, method] of Object.entries(settings.methods ?? {})) {
    if (!method?.enabled) continue;

    const mapping = CORE_METHOD_MODAL_MAP[key];
    if (!mapping) continue;

    if (mapping.isQPay) {
      qPayAdded = true;
    }

    options.push({
      id: `method:${key}`,
      label: mapping.label,
      isCash: mapping.isCash ?? false,
      isQPay: mapping.isQPay ?? false,
    });
  }

  for (const integration of settings.integrations ?? []) {
    if (!integration.enabled) continue;

    if (integration.key === "qpay") {
      if (!qPayAdded) {
        options.push({
          id: "integration:qpay",
          label: "QPay",
          isCash: false,
          isQPay: true,
        });
        qPayAdded = true;
      }
      continue;
    }

    options.push({
      id: `integration:${integration.key}`,
      label: integration.label?.trim() || integration.key,
      isCash: false,
      isQPay: false,
    });
  }

  return options;
}

export function buildDefaultEnabledPaymentMethodOptions(): PaymentMethodOption[] {
  return buildEnabledPaymentMethodOptions(PAYMENT_SETTINGS_DEFAULTS);
}

export function findPaymentMethodOption(
  options: PaymentMethodOption[],
  label: string
): PaymentMethodOption | undefined {
  return options.find((option) => option.label === label);
}

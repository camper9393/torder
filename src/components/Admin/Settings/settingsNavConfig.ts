import {
  Building2,
  CreditCard,
  FileText,
  GitBranch,
  History,
  Receipt,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type SettingsNavKey =
  | "company"
  | "branches"
  | "staff"
  | "users"
  | "payments"
  | "receipt"
  | "vat"
  | "audit"
  | "subscription";

export type SettingsNavItem = {
  key: SettingsNavKey;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Ресторан сонголт шаардлагагүй (жишээ: хэрэглэгчийн профайл) */
  skipRestaurantGate?: boolean;
};

/** Main menu логик дарааллаар */
export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    key: "company",
    label: "Байгууллага",
    href: "/admin/settings/company",
    icon: Building2,
  },
  {
    key: "branches",
    label: "Салбар",
    href: "/admin/settings/branches",
    icon: GitBranch,
  },
  {
    key: "staff",
    label: "Ажилтан",
    href: "/admin/settings/staff",
    icon: Users,
  },
  {
    key: "users",
    label: "Хэрэглэгч",
    href: "/admin/settings/users",
    icon: User,
    skipRestaurantGate: true,
  },
  {
    key: "payments",
    label: "Төлбөрийн суваг",
    href: "/admin/settings/payments",
    icon: CreditCard,
  },
  {
    key: "receipt",
    label: "Баримт",
    href: "/admin/settings/receipt",
    icon: Receipt,
  },
  {
    key: "vat",
    label: "НӨАТ",
    href: "/admin/settings/vat",
    icon: FileText,
  },
  {
    key: "audit",
    label: "Үйлдлийн бүртгэл",
    href: "/admin/settings/audit",
    icon: History,
  },
  {
    key: "subscription",
    label: "TOrder төлбөр",
    href: "/admin/settings/subscription",
    icon: Wallet,
  },
];

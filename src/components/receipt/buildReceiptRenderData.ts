import type { ReceiptData, ReceiptCompanyInfo } from "@/components/receipt/receiptTypes";
import { EMPTY_INFO_LABEL, resolveReceiptCompanyFields } from "@/components/receipt/receiptCompany";
import type { KitchenOrder } from "@/types/kitchenOrder";
import type { TablePaymentReceiptData } from "@/utils/tablePayment";
import {
  computeLineItemSubtotal,
  computeOrderTotal,
  resolveLineItemQuantity,
} from "@/utils/orderTotals";
import { resolveOrderDisplayNumber } from "@/utils/orderNumberDisplay";

export type ReceiptLineItem = {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type ReceiptRenderData = {
  restaurantName: string;
  address: string;
  phone: string;
  logoUrl: string;
  tableName: string;
  orderIdShort: string;
  dateLabel: string;
  guestCount?: number;
  orderStatus?: string;
  vatType?: string;
  isPaidReceipt: boolean;
  items: ReceiptLineItem[];
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  totalLabel: string;
  totalAmount: number;
  paidAmount?: number;
  changeAmount?: number;
  paymentMethod?: string;
  customerLabel?: string;
  staffName?: string;
};

/** Зөвхөн захиалгын жишээ хэсэг — компанийн мэдээлэл биш */
const RECEIPT_PREVIEW_ORDER_SAMPLE = {
  tableName: "5",
  orderIdShort: "1042",
  guestCount: 2,
  isPaidReceipt: true as const,
  items: [
    { name: "Хуушуур", qty: 2, unitPrice: 6000, lineTotal: 12000 },
    { name: "Уух зүйл", qty: 1, unitPrice: 8000, lineTotal: 8000 },
  ],
  subtotal: 20000,
  discountAmount: 0,
  vatAmount: 2000,
  totalLabel: "Төлсөн дүн",
  totalAmount: 22000,
  paidAmount: 22000,
  changeAmount: 0,
  paymentMethod: "Бэлэн",
  vatType: "Иргэн" as const,
  customerLabel: "Зочин",
  staffName: "Жишээ ажилтан",
};

export function buildReceiptPreviewRenderData({
  company,
  settings,
  dateLabel,
}: {
  company: ReceiptCompanyInfo;
  settings: ReceiptData;
  dateLabel: string;
}): ReceiptRenderData {
  const companyFields = resolveReceiptCompanyFields({ company, settings });

  return {
    ...companyFields,
    dateLabel,
    tableName: RECEIPT_PREVIEW_ORDER_SAMPLE.tableName,
    orderIdShort: RECEIPT_PREVIEW_ORDER_SAMPLE.orderIdShort,
    guestCount: RECEIPT_PREVIEW_ORDER_SAMPLE.guestCount,
    isPaidReceipt: RECEIPT_PREVIEW_ORDER_SAMPLE.isPaidReceipt,
    items: RECEIPT_PREVIEW_ORDER_SAMPLE.items,
    subtotal: RECEIPT_PREVIEW_ORDER_SAMPLE.subtotal,
    discountAmount: RECEIPT_PREVIEW_ORDER_SAMPLE.discountAmount,
    vatAmount: RECEIPT_PREVIEW_ORDER_SAMPLE.vatAmount,
    totalLabel: RECEIPT_PREVIEW_ORDER_SAMPLE.totalLabel,
    totalAmount: RECEIPT_PREVIEW_ORDER_SAMPLE.totalAmount,
    paidAmount: RECEIPT_PREVIEW_ORDER_SAMPLE.paidAmount,
    changeAmount: RECEIPT_PREVIEW_ORDER_SAMPLE.changeAmount,
    paymentMethod: RECEIPT_PREVIEW_ORDER_SAMPLE.paymentMethod,
    vatType: RECEIPT_PREVIEW_ORDER_SAMPLE.vatType,
    customerLabel: settings.showCustomerInfo
      ? RECEIPT_PREVIEW_ORDER_SAMPLE.customerLabel
      : undefined,
    staffName: settings.showStaffName
      ? RECEIPT_PREVIEW_ORDER_SAMPLE.staffName
      : undefined,
  };
}

export function buildReceiptRenderData({
  order,
  payment,
  company,
  settings,
  fallbackRestaurantName,
  dateLocale,
  formatItemName,
  orderStatusLabel,
}: {
  order: KitchenOrder;
  payment: TablePaymentReceiptData | null;
  company: ReceiptCompanyInfo;
  settings: ReceiptData;
  fallbackRestaurantName: string;
  dateLocale: string;
  formatItemName: (
    item: KitchenOrder["items"][number],
    qty: number
  ) => string;
  orderStatusLabel?: string;
}): ReceiptRenderData {
  const companyFields = resolveReceiptCompanyFields({
    company,
    settings,
    fallbackName: fallbackRestaurantName,
  });

  const receiptItems: ReceiptLineItem[] = order.items.map((item) => {
    const qty = resolveLineItemQuantity(item);
    const lineTotal = computeLineItemSubtotal(item);
    const unitPrice = qty > 0 ? Math.round(lineTotal / qty) : item.price;
    return {
      name: formatItemName(item, qty),
      qty,
      unitPrice,
      lineTotal,
    };
  });

  const receiptSubtotal = payment?.subtotal ?? computeOrderTotal(order.items);
  const receiptTotal = payment?.amountDue ?? computeOrderTotal(order.items);
  const orderIdShort = resolveOrderDisplayNumber(order);
  const receiptDate = payment?.paidAt ?? order.createdAt;

  const formatReceiptDate = (value: string) =>
    new Date(value).toLocaleString(dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const isPaidReceipt = Boolean(payment);

  return {
    ...companyFields,
    tableName: order.tableName,
    orderIdShort,
    dateLabel: formatReceiptDate(receiptDate),
    guestCount: payment?.guestCount,
    orderStatus: orderStatusLabel,
    vatType: payment?.vatType,
    isPaidReceipt,
    items: receiptItems,
    subtotal: payment?.subtotal ?? receiptSubtotal,
    discountAmount: payment?.discountAmount ?? 0,
    vatAmount: payment?.vatAmount ?? 0,
    totalLabel: isPaidReceipt ? "Төлсөн дүн" : "Нийт",
    totalAmount: isPaidReceipt
      ? (payment?.paidAmount ?? receiptTotal)
      : receiptTotal,
    paidAmount: payment?.paidAmount,
    changeAmount: payment?.changeAmount,
    paymentMethod: payment?.paymentMethod,
    customerLabel:
      payment?.vatType === "Байгууллага"
        ? "Байгууллага"
        : payment?.guestCount
          ? `${payment.guestCount} зочин`
          : "Зочин",
    staffName: undefined,
  };
}

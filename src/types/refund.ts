import type { RefundReason, RefundType } from "@/model/refund";
import type { RefundStatus } from "@/model/order";

export type RefundedLineItem = {
  lineIndex: number;
  menuItemId?: string;
  title: string;
  quantityRefunded: number;
  amountRefunded: number;
};

export type RefundLineInput = {
  lineIndex: number;
  quantity: number;
  returnToInventory: boolean;
};

export type CreateRefundPayload = {
  orderId: string;
  refundType: RefundType;
  reason: RefundReason;
  paymentMethod?: string;
  items: RefundLineInput[];
};

export type RefundRecord = {
  _id: string;
  orderId: string;
  tableName: string;
  items: {
    lineIndex: number;
    menuItemId?: string;
    title: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    returnToInventory: boolean;
  }[];
  refundAmount: number;
  reason: RefundReason;
  refundType: RefundType;
  paymentMethod: string;
  createdByName?: string;
  createdAt: string;
};

export type RefundEligibilityLine = {
  lineIndex: number;
  title: string;
  unitPrice: number;
  orderedQuantity: number;
  refundedQuantity: number;
  refundableQuantity: number;
  defaultReturnToInventory: boolean;
};

export type RefundEligibility = {
  orderId: string;
  orderNumber: string;
  tableName: string;
  paidAmount: number;
  paymentMethod: string;
  refundStatus: RefundStatus;
  refundedAmount: number;
  netAmount: number;
  lines: RefundEligibilityLine[];
  canRefund: boolean;
};

export const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  customer_cancelled: "Хэрэглэгч цуцалсан",
  wrong_item: "Буруу бараа",
  item_unavailable: "Бараа дууссан",
  quality_issue: "Чанарын асуудал",
  staff_mistake: "Ажилтны алдаа",
  other: "Бусад",
};

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  none: "Буцаалтгүй",
  partial: "Хэсэгчилсэн буцаалт",
  full: "Бүтэн буцаалт",
};

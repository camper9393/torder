import type { OrderStatus } from "@/model/order";
import type { RefundReason } from "@/model/refund";
import type { KitchenOrder } from "@/types/kitchenOrder";
import type { ReportDatePreset } from "@/utils/reports/dateRange";

export type SalesReportMetrics = {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  refundAmount: number;
  netRevenue: number;
};

export type SalesChartPoint = {
  label: string;
  revenue: number;
  orders: number;
};

export type SalesByRow = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

export type SalesReportData = {
  range: { preset: ReportDatePreset; label: string; from: string; to: string };
  metrics: SalesReportMetrics;
  dailySales: SalesChartPoint[];
  hourlySales: SalesChartPoint[];
  weeklyTrend: SalesChartPoint[];
  salesByDate: SalesByRow[];
  salesByTable: SalesByRow[];
};

export type OrderHistoryRow = {
  _id: string;
  orderNumber: string;
  tableName: string;
  /** @deprecated closed date slice — use closedAt */
  date: string;
  /** @deprecated closed time — use closedAt */
  time: string;
  createdAt: string;
  closedAt: string;
  itemsCount: number;
  total: number;
  netTotal: number;
  grossTotal: number;
  discountAmount: number;
  paidAmount: number;
  paymentMethod?: string;
  vatType?: string;
  status: OrderStatus;
  refundStatus?: string;
};

export type OrderHistoryReportData = {
  orders: OrderHistoryRow[];
  tables: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type OrderHistoryDetailData = KitchenOrder & {
  orderNumber: string;
  itemsCount: number;
  taxAmount: number;
  netTotal: number;
};

export type RefundReportRow = {
  _id: string;
  orderId: string;
  orderNumber: string;
  tableName: string;
  refundAmount: number;
  reason: RefundReason;
  reasonLabel: string;
  date: string;
  time: string;
  userName: string;
};

export type RefundReportData = {
  metrics: { refundCount: number; refundAmount: number };
  refunds: RefundReportRow[];
  trend: SalesChartPoint[];
  reasons: { reason: RefundReason; label: string; count: number; amount: number }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SummaryWidget = {
  title: string;
  name: string;
  quantity: number;
  revenue: number;
};

export type ProductSalesRow = {
  productName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  averagePrice: number;
  refundQuantity: number;
  netRevenue: number;
};

export type ProductSalesReportData = {
  range: { label: string; from: string; to: string };
  categories: string[];
  metrics: {
    totalProductsSold: number;
    totalProductRevenue: number;
    bestProduct: string | null;
    bestCategory: string | null;
  };
  topByQuantity: { label: string; quantity: number; revenue: number }[];
  topByRevenue: { label: string; quantity: number; revenue: number }[];
  categoryRevenue: SalesByRow[];
  products: ProductSalesRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type TransactionReportRow = {
  date: string;
  paymentMethod: string;
  paymentMethodKey: string;
  transactionCount: number;
  grossAmount: number;
  refundAmount: number;
  netAmount: number;
};

export type TransactionReportData = {
  range: { label: string; from: string; to: string };
  metrics: {
    totalAmount: number;
    totalCount: number;
    mostUsedMethod: string | null;
    refundAmount: number;
    netAmount: number;
  };
  byMethod: {
    method: string;
    methodKey: string;
    count: number;
    gross: number;
    refunds: number;
    net: number;
  }[];
  dailyTrend: SalesChartPoint[];
  rows: TransactionReportRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type KitchenProductPrepRow = {
  productName: string;
  quantityCooked: number;
  averagePrepMinutes: number | null;
  fastestPrepMinutes: number | null;
  slowestPrepMinutes: number | null;
};

export type KitchenReportData = {
  range: { label: string; from: string; to: string };
  perItemPrepAvailable: boolean;
  metrics: {
    totalCookedOrders: number;
    totalCookedItems: number;
    averagePrepMinutes: number | null;
    fastestOrderPrepMinutes: number | null;
    slowestOrderPrepMinutes: number | null;
  };
  productStats: KitchenProductPrepRow[];
  hourlyWorkload: SalesChartPoint[];
  ordersPerHour: SalesChartPoint[];
  prepTimeTrend: { label: string; minutes: number }[];
  topCookedItems: { label: string; quantity: number }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type WaiterReportRow = {
  waiterName: string;
  ordersHandled: number;
  revenue: number;
  averageTicket: number;
  refundsHandled: number;
  netRevenue: number;
};

export type WaiterReportData = {
  available: boolean;
  message?: string;
  range: { label: string; from: string; to: string };
  metrics: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    mostActiveWaiter: string | null;
  };
  waiters: WaiterReportRow[];
  revenueByWaiter: { label: string; revenue: number }[];
  ordersByWaiter: { label: string; orders: number }[];
};

export type VatSummaryRow = {
  period: string;
  grossSales: number;
  refundAmount: number;
  taxableSales: number;
  vatAmount: number;
  netVat: number;
};

export type VatReportData = {
  range: { label: string; from: string; to: string };
  vatRate: number;
  metrics: {
    grossSales: number;
    taxableSales: number;
    vatAmount: number;
    refundVat: number;
    netVat: number;
  };
  daily: VatSummaryRow[];
  monthly: VatSummaryRow[];
};

export type SummaryReportData = {
  range: { label: string; from: string; to: string };
  metrics: {
    grossSales: number;
    netSales: number;
    refunds: number;
    averageTicket: number;
    tableTurnoverRate: number;
    orderCount: number;
    activeTables: number;
  };
  revenueTrend: SalesChartPoint[];
  topCategories: SalesByRow[];
  salesDistribution: { name: string; value: number }[];
  widgets: {
    bestProduct: SummaryWidget | null;
    bestDrink: SummaryWidget | null;
    mostActiveTable: SummaryWidget | null;
  };
};

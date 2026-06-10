import mongoServer from "@/config/mongoConfig";
import { resolveMerchantId } from "@/middleware/auth";
import { Order } from "@/model/order";
import { Refund } from "@/model/refund";
import { sendRJResponse } from "@/utils/api";
import {
  completedOrdersMatch,
  GROSS_SALES_EXPR,
  refundsMatch,
  reportDateToString,
  reportMonthString,
} from "@/utils/reports/aggregations";
import {
  resolveReportDateRange,
  validateCustomReportRange,
} from "@/utils/reports/dateRange";
import {
  calcTaxableFromGross,
  calcVatFromInclusive,
  DEFAULT_VAT_RATE,
} from "@/utils/reports/vat";
import { NextRequest } from "next/server";

function buildVatRow(period: string, gross: number, refunds: number) {
  const taxableSales = calcTaxableFromGross(gross, refunds);
  const vatAmount = calcVatFromInclusive(taxableSales);
  const refundVat = calcVatFromInclusive(refunds);
  return {
    period,
    grossSales: gross,
    refundAmount: refunds,
    taxableSales,
    vatAmount,
    netVat: vatAmount - refundVat,
  };
}

export async function GET(req: NextRequest) {
  try {
    await mongoServer();
    const merchantId = await resolveMerchantId(req);
    if (!merchantId) {
      return sendRJResponse({
        success: false,
        message: "Unauthorized",
        status: 401,
      });
    }

    const params = req.nextUrl.searchParams;
    const rangeError = validateCustomReportRange(
      params.get("preset"),
      params.get("from"),
      params.get("to")
    );
    if (rangeError) {
      return sendRJResponse({
        success: false,
        message: rangeError,
        status: 400,
      });
    }
    const range = resolveReportDateRange(
      params.get("preset") || "thisMonth",
      params.get("from"),
      params.get("to")
    );

    const orderMatch = completedOrdersMatch(merchantId, range);
    const refundMatch = refundsMatch(merchantId, range);

    const [dailySales, dailyRefunds, monthlySales, monthlyRefunds, totalSales] =
      await Promise.all([
        Order.aggregate([
          { $match: orderMatch },
          {
            $group: {
              _id: reportDateToString("$updatedAt"),
              gross: { $sum: GROSS_SALES_EXPR },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Refund.aggregate([
          { $match: refundMatch },
          {
            $group: {
              _id: reportDateToString("$createdAt"),
              refunds: { $sum: "$refundAmount" },
            },
          },
        ]),
        Order.aggregate([
          { $match: orderMatch },
          {
            $group: {
              _id: reportMonthString("$updatedAt"),
              gross: { $sum: GROSS_SALES_EXPR },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Refund.aggregate([
          { $match: refundMatch },
          {
            $group: {
              _id: reportMonthString("$createdAt"),
              refunds: { $sum: "$refundAmount" },
            },
          },
        ]),
        Order.aggregate([
          { $match: orderMatch },
          {
            $group: {
              _id: null,
              gross: { $sum: GROSS_SALES_EXPR },
            },
          },
        ]),
      ]);

    const refundTotalAgg = await Refund.aggregate([
      { $match: refundMatch },
      { $group: { _id: null, refunds: { $sum: "$refundAmount" } } },
    ]);

    const grossSales = totalSales[0]?.gross ?? 0;
    const refundAmount = refundTotalAgg[0]?.refunds ?? 0;
    const taxableSales = calcTaxableFromGross(grossSales, refundAmount);
    const vatAmount = calcVatFromInclusive(taxableSales);
    const refundVat = calcVatFromInclusive(refundAmount);

    const dailyRefundMap = new Map(
      dailyRefunds.map((row: { _id: string; refunds: number }) => [
        row._id,
        row.refunds,
      ])
    );
    const monthlyRefundMap = new Map(
      monthlyRefunds.map((row: { _id: string; refunds: number }) => [
        row._id,
        row.refunds,
      ])
    );

    const daily = dailySales.map((row: { _id: string; gross: number }) =>
      buildVatRow(row._id, row.gross, dailyRefundMap.get(row._id) ?? 0)
    );

    const monthly = monthlySales.map((row: { _id: string; gross: number }) =>
      buildVatRow(row._id, row.gross, monthlyRefundMap.get(row._id) ?? 0)
    );

    return sendRJResponse({
      success: true,
      message: "VAT report fetched",
      data: {
        range: {
          label: range.label,
          from: range.start.toISOString(),
          to: range.end.toISOString(),
        },
        vatRate: DEFAULT_VAT_RATE,
        metrics: {
          grossSales,
          taxableSales,
          vatAmount,
          refundVat,
          netVat: vatAmount - refundVat,
        },
        daily,
        monthly,
      },
      status: 200,
    });
  } catch (error) {
    console.error("VAT report error:", error);
    return sendRJResponse({
      success: false,
      message: "Internal server error",
      status: 500,
    });
  }
}

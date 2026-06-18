import type { OrderHistoryRow } from "@/types/reports";
import { formatPrice } from "@/utils/currency";
import {
  computeTodaySummary,
  formatReportDateTime,
  resolveOrderStatusBadge,
  resolveVatTypeLabel,
} from "@/utils/reports/orderHistoryDisplay";

export type OrderHistoryExportRecord = {
  "Order No": string;
  Table: string;
  "Opened Time": string;
  "Closed Time": string;
  "Item Count": number;
  Total: number;
  Discount: number;
  "Paid Amount": number;
  "Payment Method": string;
  "Receipt Type": string;
  Status: string;
  Employee: string;
};

export type OrderHistoryPrintOptions = {
  title: string;
  dateRangeLabel: string;
  rows: OrderHistoryRow[];
};

const PRINT_ROOT_ID = "order-history-print-root";
const PRINT_STYLE_ID = "order-history-print-styles";

function exportFilename(ext: "csv" | "xlsx") {
  const date = new Date().toISOString().slice(0, 10);
  return `order-history-${date}.${ext}`;
}

function rowToExportRecord(row: OrderHistoryRow): OrderHistoryExportRecord {
  const started = formatReportDateTime(row.createdAt);
  const closed = formatReportDateTime(row.closedAt);
  const status = resolveOrderStatusBadge(row.status, row.refundStatus);

  return {
    "Order No": row.orderNumber,
    Table: row.tableName,
    "Opened Time": started.full,
    "Closed Time": closed.full,
    "Item Count": row.itemsCount,
    Total: row.grossTotal,
    Discount: row.discountAmount,
    "Paid Amount": row.paidAmount,
    "Payment Method": row.paymentMethod?.trim() || "—",
    "Receipt Type": resolveVatTypeLabel(row.vatType),
    Status: status.label,
    Employee: "—",
  };
}

function escapeCsvCell(value: string | number) {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportOrderHistoryCsv(
  rows: OrderHistoryRow[],
  filename = exportFilename("csv")
) {
  const records = rows.map(rowToExportRecord);
  const headers = Object.keys(records[0] ?? rowToExportRecord({
    _id: "",
    orderNumber: "",
    tableName: "",
    date: "",
    time: "",
    createdAt: "",
    closedAt: "",
    itemsCount: 0,
    total: 0,
    netTotal: 0,
    grossTotal: 0,
    discountAmount: 0,
    paidAmount: 0,
    status: "closed",
  }));

  const lines = records.map((record) =>
    headers.map((key) => escapeCsvCell(record[key as keyof OrderHistoryExportRecord])).join(",")
  );

  const csv = "\uFEFF" + [headers.join(","), ...lines].join("\r\n");
  downloadBlob(csv, filename, "text/csv;charset=utf-8;");
}

export async function exportOrderHistoryExcel(
  rows: OrderHistoryRow[],
  filename = exportFilename("xlsx")
) {
  const XLSX = await import("xlsx");
  const records = rows.map(rowToExportRecord);
  const worksheet = XLSX.utils.json_to_sheet(records);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Order History");
  XLSX.writeFile(workbook, filename);
}

function buildPrintHtml({ title, dateRangeLabel, rows }: OrderHistoryPrintOptions) {
  const summary = computeTodaySummary(rows);
  const th =
    "padding:8px 6px;border:1px solid #ccc;background:#f3f4f6;font-size:10px;text-align:left;white-space:nowrap";
  const td =
    "padding:6px;border:1px solid #e5e7eb;font-size:10px;vertical-align:top";

  const summaryHtml = `
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 16px">
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px">
        <div style="font-size:11px;color:#6b7280">Захиалгын тоо</div>
        <div style="font-size:18px;font-weight:700">${summary.count}</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px">
        <div style="font-size:11px;color:#6b7280">Нийт орлого</div>
        <div style="font-size:18px;font-weight:700">${formatPrice(summary.revenue)}</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px">
        <div style="font-size:11px;color:#6b7280">Дундаж захиалга</div>
        <div style="font-size:18px;font-weight:700">${formatPrice(summary.averageOrderValue)}</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:10px">
        <div style="font-size:11px;color:#6b7280">Буцаалтын тоо</div>
        <div style="font-size:18px;font-weight:700">${summary.refundCount}</div>
      </div>
    </div>`;

  const body = rows
    .map((row) => {
      const record = rowToExportRecord(row);
      return `<tr>
        <td style="${td}">#${record["Order No"]}</td>
        <td style="${td}">${record.Table}</td>
        <td style="${td}">${record["Opened Time"]}</td>
        <td style="${td}">${record["Closed Time"]}</td>
        <td style="${td};text-align:right">${record["Item Count"]}</td>
        <td style="${td};text-align:right">${formatPrice(record.Total)}</td>
        <td style="${td};text-align:right">${formatPrice(record.Discount)}</td>
        <td style="${td};text-align:right">${formatPrice(record["Paid Amount"])}</td>
        <td style="${td}">${record["Payment Method"]}</td>
        <td style="${td}">${record["Receipt Type"]}</td>
        <td style="${td}">${record.Status}</td>
        <td style="${td}">${record.Employee}</td>
      </tr>`;
    })
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#111;padding:16px">
      <h1 style="margin:0 0 4px;font-size:22px">${title}</h1>
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280">Хугацаа: ${dateRangeLabel}</p>
      <p style="margin:0 0 16px;font-size:12px;color:#6b7280">
        Хэвлэсэн: ${new Date().toLocaleString("mn-MN")}
      </p>
      ${summaryHtml}
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="${th}">Захиалгын №</th>
            <th style="${th}">Ширээ</th>
            <th style="${th}">Эхэлсэн</th>
            <th style="${th}">Хаагдсан</th>
            <th style="${th}">Бараа</th>
            <th style="${th}">Нийт</th>
            <th style="${th}">Хөнг.</th>
            <th style="${th}">Төлсөн</th>
            <th style="${th}">Төлбөр</th>
            <th style="${th}">Баримт</th>
            <th style="${th}">Төлөв</th>
            <th style="${th}">Ажилтан</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </div>`;
}

function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      body * { visibility: hidden !important; }
      #${PRINT_ROOT_ID}, #${PRINT_ROOT_ID} * { visibility: visible !important; }
      #${PRINT_ROOT_ID} {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        background: #fff !important;
      }
    }
    @media screen {
      #${PRINT_ROOT_ID} { display: none !important; }
    }
  `;
  document.head.appendChild(style);
}

export function printOrderHistoryReport(options: OrderHistoryPrintOptions) {
  if (typeof window === "undefined") return;

  ensurePrintStyles();

  document.getElementById(PRINT_ROOT_ID)?.remove();

  const root = document.createElement("div");
  root.id = PRINT_ROOT_ID;
  root.innerHTML = buildPrintHtml(options);
  document.body.appendChild(root);

  const cleanup = () => {
    root.remove();
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.print();
}

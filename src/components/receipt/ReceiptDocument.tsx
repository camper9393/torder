"use client";

import React from "react";

import type { ReceiptRenderData } from "@/components/receipt/buildReceiptRenderData";
import { EMPTY_INFO_LABEL } from "@/components/receipt/receiptCompany";
import type { ReceiptData } from "@/components/receipt/receiptTypes";
import { formatPrice } from "@/utils/currency";
import { cn } from "@/lib/utils";

function ReceiptDivider() {
  return <div className="receipt-divider" />;
}

function ReceiptRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p className="receipt-row">
      <span>{label}</span>
      <span>{value}</span>
    </p>
  );
}

export default function ReceiptDocument({
  settings,
  data,
  className,
}: {
  settings: ReceiptData;
  data: ReceiptRenderData;
  className?: string;
}) {
  const restaurantName =
    settings.headerText.trim() ||
    data.restaurantName.trim() ||
    EMPTY_INFO_LABEL;

  const logoUrl = data.logoUrl.trim() || settings.logoUrl.trim();

  const showMainContent = !settings.ebarimtQrOnly;

  const showGenericQr =
    !settings.ebarimtQrOnly &&
    !settings.showDeliveryQr &&
    settings.showPaymentMethod &&
    data.isPaidReceipt;

  const showDeliveryQr =
    settings.showDeliveryQr && !settings.ebarimtQrOnly;

  return (
    <div
      className={cn(
        "receipt-inner",
        settings.receiptSize === "58mm" ? "receipt-size-58mm" : "receipt-size-80mm",
        className
      )}
      style={{
        fontSize: `${settings.fontSize}px`,
        lineHeight: 1.45,
      }}
    >
      {showMainContent ? (
        <>
          {settings.showLogo ? (
            <div className="receipt-logo-wrap">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="receipt-logo-img"
                />
              ) : (
                <p className="receipt-sub receipt-contact">{EMPTY_INFO_LABEL}</p>
              )}
            </div>
          ) : null}

          <p className="receipt-title">{restaurantName}</p>

          {settings.showAddressPhone ? (
            <>
              <p className="receipt-sub receipt-contact">{data.address}</p>
              <p className="receipt-sub receipt-contact">
                Утас: {data.phone}
              </p>
            </>
          ) : null}

          <ReceiptDivider />

          <ReceiptRow label="Ширээ" value={data.tableName} />
          <ReceiptRow label="Захиалга №" value={`#${data.orderIdShort}`} />
          <ReceiptRow label="Огноо" value={data.dateLabel} />

          {data.guestCount ? (
            <ReceiptRow label="Зочдын тоо" value={String(data.guestCount)} />
          ) : null}

          {!data.isPaidReceipt && data.orderStatus ? (
            <ReceiptRow label="Төлөв" value={data.orderStatus} />
          ) : null}

          {data.isPaidReceipt && data.vatType ? (
            <ReceiptRow label="Баримтын төрөл" value={data.vatType} />
          ) : null}

          {settings.showCustomerInfo && data.customerLabel ? (
            <p className="receipt-meta-line">
              Худалдан авагч: {data.customerLabel}
            </p>
          ) : null}

          {settings.showStaffName && data.staffName ? (
            <p className="receipt-meta-line">Ажилтан: {data.staffName}</p>
          ) : null}

          <ReceiptDivider />
          <p className="receipt-items-head">Бараа</p>

          <ul className="receipt-items">
            {data.items.map((item, idx) => (
              <li key={`${item.name}-${idx}`} className="receipt-item-block">
                <div className="receipt-item">
                  <span className="receipt-item-name">{item.name}</span>
                  <span className="receipt-item-price">
                    {formatPrice(item.lineTotal)}
                  </span>
                </div>
                {settings.printQuantity && item.qty > 0 ? (
                  <p className="receipt-item-qty">
                    {item.qty} x {formatPrice(item.unitPrice)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          <ReceiptDivider />

          {data.isPaidReceipt ? (
            <>
              <ReceiptRow label="Дэд дүн" value={formatPrice(data.subtotal)} />
              {data.discountAmount > 0 ? (
                <ReceiptRow
                  label="Хөнгөлөлт"
                  value={`-${formatPrice(data.discountAmount)}`}
                />
              ) : null}
              {data.vatType !== "НӨАТ-гүй" && data.vatAmount > 0 ? (
                <ReceiptRow label="НӨАТ" value={formatPrice(data.vatAmount)} />
              ) : null}
              <p className="receipt-total">
                <span>{data.totalLabel}</span>
                <span>{formatPrice(data.totalAmount)}</span>
              </p>
              {data.changeAmount && data.changeAmount > 0 ? (
                <ReceiptRow label="Хариулт" value={formatPrice(data.changeAmount)} />
              ) : null}
            </>
          ) : (
            <p className="receipt-total">
              <span>{data.totalLabel}</span>
              <span>{formatPrice(data.totalAmount)}</span>
            </p>
          )}

          {settings.showPaymentMethod && data.paymentMethod ? (
            <p className="receipt-meta-line receipt-payment">
              Төлбөр: {data.paymentMethod}
            </p>
          ) : null}
        </>
      ) : null}

      {settings.ebarimtQrOnly ? (
        <>
          <ReceiptDivider />
          <div className="receipt-qr-wrap">
            <div className="receipt-qr receipt-qr-ebarimt">E-BARIMT QR</div>
          </div>
        </>
      ) : null}

      {showDeliveryQr ? (
        <>
          <ReceiptDivider />
          <div className="receipt-qr-wrap">
            <div className="receipt-qr receipt-qr-delivery">DELIVERY QR</div>
          </div>
        </>
      ) : null}

      {showGenericQr ? (
        <div className="receipt-qr-wrap">
          <div className="receipt-qr receipt-qr-generic">QR</div>
        </div>
      ) : null}

      <ReceiptDivider />

      {settings.thankYouMessage.trim() ? (
        <p className="receipt-footer receipt-thanks">{settings.thankYouMessage}</p>
      ) : null}

      {settings.additionalInfo.trim() ? (
        <p className="receipt-footer receipt-additional">
          {settings.additionalInfo}
        </p>
      ) : null}
    </div>
  );
}

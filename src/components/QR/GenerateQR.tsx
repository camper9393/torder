"use client"

import React, { useEffect, useRef, useState } from "react"
import { QRCode } from "react-qrcode-logo"

interface GenerateQRProps {
  id?: string
  value?: string
  maxSize?: number
  scanLabel?: string
  showUrl?: boolean
}

const GenerateQR: React.FC<GenerateQRProps> = ({
  id,
  value = "dev",
  maxSize = 280,
  scanLabel = "Scan to view menu",
  showUrl = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [qrSize, setQrSize] = useState(maxSize)

  const qrUrl = value
  const logoSize = Math.round(qrSize * 0.18)

  return (
    <div id={id} className="w-full flex justify-center px-4">
      <div
        ref={containerRef}
        className="flex flex-col items-center w-full max-w-[360px]"
      >
        <QRCode
          value={qrUrl}
          size={qrSize}
          // logoImage="/logo.png"
          logoWidth={logoSize}
          logoHeight={logoSize}
          qrStyle="dots"
          eyeRadius={[
            { outer: 12, inner: 4 },
            { outer: 12, inner: 4 },
            { outer: 12, inner: 4 },
          ]}
          quietZone={12}
          fgColor="#0F172A"
          bgColor="#FFFFFF"
        />

        {/* label */}
        <div className="mt-4 text-center">
          <p className="text-sm sm:text-base font-semibold text-gray-900">
            {scanLabel}
          </p>
          {showUrl && (
            <p className="mt-1 text-xs text-gray-500 break-all">{qrUrl}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GenerateQR

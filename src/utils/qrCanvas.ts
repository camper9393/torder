export function getQrCanvas(domId: string): HTMLCanvasElement | null {
  return document.querySelector(
    `#${domId} canvas`
  ) as HTMLCanvasElement | null
}

export function downloadQrPng(domId: string, filename: string): boolean {
  const canvas = getQrCanvas(domId)
  if (!canvas) return false

  const safe =
    filename.replace(/[^\w\s\u0400-\u4fff-]/g, "").trim() || "table-qr"
  const link = document.createElement("a")
  link.download = `${safe}.png`
  link.href = canvas.toDataURL("image/png")
  link.click()
  return true
}

export function printQrCard(
  domId: string,
  tableName: string,
  menuLink: string
): boolean {
  const canvas = getQrCanvas(domId)
  if (!canvas) return false

  const dataUrl = canvas.toDataURL("image/png")
  const win = window.open("", "_blank", "noopener,noreferrer")
  if (!win) return false

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(tableName)}</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 24px; margin: 0; }
    h1 { font-size: 28px; margin: 0 0 16px; }
    img { width: 280px; height: 280px; }
    p { font-size: 12px; word-break: break-all; color: #444; max-width: 320px; margin: 16px auto 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(tableName)}</h1>
  <img src="${dataUrl}" alt="QR" />
  <p>${escapeHtml(menuLink)}</p>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`)
  win.document.close()
  return true
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

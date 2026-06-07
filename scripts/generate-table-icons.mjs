/**
 * Generate 512x512 table status PNGs (requires: npm install sharp --no-save)
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, "..", "public", "img", "tables")
const SIZE = 512

const STATES = {
  "table-empty": { border: "#5a5650", accent: null },
  "table-new-order": { border: "#f59e0b", accent: "dot", accentColor: "#fbbf24" },
  "table-accepted": { border: "#3b82f6", accent: "ring", accentColor: "#60a5fa" },
  "table-cooking": { border: "#f97316", accent: "steam", accentColor: "#fb923c" },
  "table-done": { border: "#22c55e", accent: "check", accentColor: "#4ade80" },
}

function svgForState(name, spec) {
  const cx = SIZE / 2
  const cy = SIZE / 2
  const border = spec.border
  const accent = spec.accent
  const accentColor = spec.accentColor ?? border

  let accentSvg = ""
  const badgeX = SIZE - 108
  const badgeY = 108

  if (accent === "dot") {
    accentSvg = `
      <circle cx="${badgeX}" cy="${badgeY}" r="28" fill="${accentColor}" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
      <circle cx="${badgeX}" cy="${badgeY}" r="10" fill="rgba(255,255,255,0.85)"/>
    `
  } else if (accent === "ring") {
    accentSvg = `
      <ellipse cx="${cx}" cy="${cy}" rx="130" ry="100" fill="none" stroke="${accentColor}" stroke-width="6"/>
    `
  } else if (accent === "steam") {
    accentSvg = `
      <circle cx="${cx - 18}" cy="${cy - 95}" r="8" fill="${accentColor}" opacity="0.9"/>
      <circle cx="${cx - 18}" cy="${cy - 117}" r="11" fill="${accentColor}" opacity="0.65"/>
      <circle cx="${cx}" cy="${cy - 99}" r="9" fill="${accentColor}" opacity="0.85"/>
      <circle cx="${cx}" cy="${cy - 123}" r="12" fill="${accentColor}" opacity="0.55"/>
      <circle cx="${cx + 18}" cy="${cy - 95}" r="8" fill="${accentColor}" opacity="0.9"/>
      <circle cx="${cx + 18}" cy="${cy - 117}" r="11" fill="${accentColor}" opacity="0.65"/>
    `
  } else if (accent === "check") {
    accentSvg = `
      <circle cx="${badgeX}" cy="${badgeY}" r="32" fill="${accentColor}" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
      <polyline points="${badgeX - 14},${badgeY + 2} ${badgeX - 2},${badgeY + 14} ${badgeX + 18},${badgeY - 10}"
        fill="none" stroke="#161c18" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    `
  }

  const glow =
    name !== "table-empty"
      ? `
    <rect x="${cx - 126}" y="${cy - 96}" width="252" height="192" rx="32"
      fill="none" stroke="${border}" stroke-width="2" opacity="0.25"/>
    <rect x="${cx - 134}" y="${cy - 104}" width="268" height="208" rx="36"
      fill="none" stroke="${border}" stroke-width="1" opacity="0.12"/>
  `
      : ""

  const chair = (x, y, w, h) => `
    <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="10"
      fill="#373430" stroke="#44403c" stroke-width="2"/>
  `

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  ${glow}
  ${chair(cx, 72, 56, 40)}
  ${chair(cx, SIZE - 72, 56, 40)}
  ${chair(72, cy, 40, 56)}
  ${chair(SIZE - 72, cy, 40, 56)}
  <rect x="${cx - 118}" y="${cy - 88}" width="236" height="176" rx="28" fill="${border}"/>
  <rect x="${cx - 110}" y="${cy - 80}" width="220" height="160" rx="22" fill="#201e1c" stroke="#4a4540" stroke-width="3"/>
  <rect x="${cx - 98}" y="${cy - 68}" width="196" height="136" rx="16" fill="#2a2622"/>
  <line x1="${cx - 74}" y1="${cy - 22}" x2="${cx + 74}" y2="${cy - 22}" stroke="#322f2c" stroke-width="2" opacity="0.5"/>
  <line x1="${cx - 74}" y1="${cy}" x2="${cx + 74}" y2="${cy}" stroke="#322f2c" stroke-width="2" opacity="0.5"/>
  <line x1="${cx - 74}" y1="${cy + 22}" x2="${cx + 74}" y2="${cy + 22}" stroke="#322f2c" stroke-width="2" opacity="0.5"/>
  <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
    font-size="72" font-weight="600" fill="#8c826f" opacity="0.9">##</text>
  ${accentSvg}
</svg>`
}

async function main() {
  const sharp = (await import("sharp")).default
  await mkdir(OUT_DIR, { recursive: true })

  for (const [name, spec] of Object.entries(STATES)) {
    const svg = Buffer.from(svgForState(name, spec))
    const png = await sharp(svg)
      .resize(SIZE, SIZE)
      .png()
      .toBuffer()
    const outPath = path.join(OUT_DIR, `${name}.png`)
    await writeFile(outPath, png)
    console.log("Wrote", outPath)
  }
  console.log("Done.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

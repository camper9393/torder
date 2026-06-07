"""Generate 512x512 table status PNGs for the restaurant dashboard."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SIZE = 512
OUT_DIR = Path(__file__).resolve().parents[1] / "public" / "img" / "tables"

# Dark-theme POS palette
BG_TRANSPARENT = (0, 0, 0, 0)
TABLE_FILL = (32, 30, 28, 255)
TABLE_INNER = (42, 39, 36, 255)
CHAIR_FILL = (55, 52, 48, 255)
PLACEHOLDER = (140, 130, 115, 220)
MUTED_BORDER = (74, 69, 64, 255)

STATES = {
    "table-empty": {
        "border": (90, 86, 80, 255),
        "accent": None,
    },
    "table-new-order": {
        "border": (245, 158, 11, 255),
        "accent": "dot",
        "accent_color": (251, 191, 36, 255),
    },
    "table-accepted": {
        "border": (59, 130, 246, 255),
        "accent": "ring",
        "accent_color": (96, 165, 250, 255),
    },
    "table-cooking": {
        "border": (249, 115, 22, 255),
        "accent": "steam",
        "accent_color": (251, 146, 60, 255),
    },
    "table-done": {
        "border": (34, 197, 94, 255),
        "accent": "check",
        "accent_color": (74, 222, 128, 255),
    },
}


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for name in (
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_chair(draw: ImageDraw.ImageDraw, cx: int, cy: int, w: int, h: int) -> None:
    draw.rounded_rectangle(
        (cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2),
        radius=10,
        fill=CHAIR_FILL,
        outline=(68, 64, 58, 255),
        width=2,
    )


def draw_table_base(img: Image.Image, draw: ImageDraw.ImageDraw, border_color: tuple) -> None:
    cx, cy = SIZE // 2, SIZE // 2

    # Chairs — top-down at four sides
    draw_chair(draw, cx, 72, 56, 40)
    draw_chair(draw, cx, SIZE - 72, 56, 40)
    draw_chair(draw, 72, cy, 40, 56)
    draw_chair(draw, SIZE - 72, cy, 40, 56)

    # Table surface
    tw, th = 220, 160
    outer = (cx - tw // 2 - 8, cy - th // 2 - 8, cx + tw // 2 + 8, cy + th // 2 + 8)
    draw.rounded_rectangle(outer, radius=28, fill=border_color, outline=None)
    inner = (cx - tw // 2, cy - th // 2, cx + tw // 2, cy + th // 2)
    draw.rounded_rectangle(inner, radius=22, fill=TABLE_FILL, outline=MUTED_BORDER, width=3)
    draw.rounded_rectangle(
        (inner[0] + 12, inner[1] + 12, inner[2] - 12, inner[3] - 12),
        radius=16,
        fill=TABLE_INNER,
        outline=None,
    )

    # Subtle wood grain lines
    for i in range(-2, 3):
        y = cy + i * 22
        draw.line(
            (inner[0] + 24, y, inner[2] - 24, y),
            fill=(50, 47, 44, 80),
            width=2,
        )


def draw_placeholder(draw: ImageDraw.ImageDraw) -> None:
    font = _font(72)
    text = "##"
    cx, cy = SIZE // 2, SIZE // 2
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(
        (cx - tw // 2 - bbox[0], cy - th // 2 - bbox[1]),
        text,
        fill=PLACEHOLDER,
        font=font,
    )


def draw_accent(
    draw: ImageDraw.ImageDraw,
    accent: str | None,
    color: tuple[int, int, int, int],
    border_color: tuple[int, int, int, int],
) -> None:
    if not accent:
        return

    cx, cy = SIZE // 2, SIZE // 2
    badge_x, badge_y = SIZE - 108, 108

    if accent == "dot":
        draw.ellipse(
            (badge_x - 28, badge_y - 28, badge_x + 28, badge_y + 28),
            fill=color,
            outline=(255, 255, 255, 40),
            width=2,
        )
        draw.ellipse(
            (badge_x - 10, badge_y - 10, badge_x + 10, badge_y + 10),
            fill=(255, 255, 255, 200),
        )

    elif accent == "ring":
        draw.ellipse(
            (cx - 130, cy - 100, cx + 130, cy + 100),
            outline=color,
            width=6,
        )

    elif accent == "steam":
        for i, ox in enumerate((-18, 0, 18)):
            bx = cx + ox
            by = cy - 95
            for j in range(3):
                t = j / 2
                r = 8 + j * 4
                y = by - j * 22
                alpha = int(180 - j * 50)
                c = (color[0], color[1], color[2], alpha)
                draw.ellipse((bx - r, y - r, bx + r, y + r), fill=c)
        draw.arc(
            (cx - 24, cy - 118, cx + 24, cy - 82),
            start=200,
            end=340,
            fill=color,
            width=4,
        )

    elif accent == "check":
        draw.ellipse(
            (badge_x - 32, badge_y - 32, badge_x + 32, badge_y + 32),
            fill=(*color[:3], 230),
            outline=(255, 255, 255, 60),
            width=2,
        )
        draw.line(
            (badge_x - 14, badge_y + 2, badge_x - 2, badge_y + 14),
            fill=(22, 30, 24, 255),
            width=6,
        )
        draw.line(
            (badge_x - 2, badge_y + 14, badge_x + 18, badge_y - 10),
            fill=(22, 30, 24, 255),
            width=6,
        )


def render_state(name: str, spec: dict) -> None:
    img = Image.new("RGBA", (SIZE, SIZE), BG_TRANSPARENT)
    draw = ImageDraw.Draw(img)
    border = spec["border"]
    draw_table_base(img, draw, border)
    draw_placeholder(draw)
    if spec.get("accent"):
        draw_accent(draw, spec["accent"], spec["accent_color"], border)

    # Outer glow for non-empty states
    if name != "table-empty":
        glow = Image.new("RGBA", (SIZE, SIZE), BG_TRANSPARENT)
        gdraw = ImageDraw.Draw(glow)
        cx, cy = SIZE // 2, SIZE // 2
        for w, a in ((8, 35), (14, 20), (20, 10)):
            gdraw.rounded_rectangle(
                (cx - 118 - w, cy - 88 - w, cx + 118 + w, cy + 88 + w),
                radius=30 + w,
                outline=(*border[:3], a),
                width=2,
            )
        img = Image.alpha_composite(glow, img)
        draw = ImageDraw.Draw(img)
        draw_placeholder(draw)

    out_path = OUT_DIR / f"{name}.png"
    img.save(out_path, "PNG", optimize=True)
    print(f"Wrote {out_path}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, spec in STATES.items():
        render_state(name, spec)
    print("Done.")


if __name__ == "__main__":
    main()

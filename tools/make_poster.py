"""生成 A4 宣传海报（带网页二维码），可贴在驿站、商家门口。

用法：
    pip install qrcode pillow
    python tools/make_poster.py
输出：docs/海报.png（300dpi）和 docs/海报.pdf
二维码指向 common.PAGES_URL，换网址后重新运行即可。
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from PIL import JpegImagePlugin  # noqa: F401  保存 PDF 时内部要用 JPEG 编码

from common import PAGES_URL, ROOT, load_taxonomy

try:
    import qrcode
except ImportError:
    raise SystemExit("需要 qrcode：pip install qrcode")

W, H = 2480, 3508          # A4 @ 300dpi
MARGIN = 200
GREEN = (31, 138, 76)
ORANGE = (210, 72, 31)
INK = (29, 33, 28)
GRAY = (93, 99, 90)
SOFT = (244, 245, 242)

FONT_DIRS = [Path("C:/Windows/Fonts"), Path("/System/Library/Fonts"), Path("/usr/share/fonts")]


def font(names, size):
    for d in FONT_DIRS:
        for n in names:
            for p in d.rglob(n) if d.exists() else []:
                return ImageFont.truetype(str(p), size)
    sys.exit("找不到中文字体（需要微软雅黑、黑体或 Noto Sans CJK）")


def bold(size):
    return font(["msyhbd.ttc", "simhei.ttf", "PingFang.ttc", "NotoSansCJK-Bold.ttc"], size)


def regular(size):
    return font(["msyh.ttc", "simhei.ttf", "PingFang.ttc", "NotoSansCJK-Regular.ttc"], size)


def center(draw, y, text, f, fill):
    w = draw.textbbox((0, 0), text, font=f)[2]
    draw.text(((W - w) / 2, y), text, font=f, fill=fill)


def main():
    tax = load_taxonomy()
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)

    # 顶部色带
    d.rectangle([0, 0, W, 760], fill=GREEN)
    center(d, 170, "五角场骑手地图", bold(210), "white")
    center(d, 470, "哪里能歇脚、喝水、充电、上厕所？", regular(86), "white")
    center(d, 590, "哪里进不去、难停车？提前知道。", regular(86), "white")

    # 二维码
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
    qr.add_data(PAGES_URL)
    qr.make(fit=True)
    q = qr.make_image(fill_color="black", back_color="white").convert("RGB").resize((1240, 1240), Image.NEAREST)
    card = [(W - 1400) // 2, 900, (W + 1400) // 2, 2300]
    d.rounded_rectangle(card, radius=60, fill=SOFT)
    img.paste(q, ((W - 1240) // 2, 980))
    center(d, 2360, "微信扫一扫，直接打开", bold(104), INK)
    center(d, 2510, "不用下载 App · 不收集个人信息", regular(64), GRAY)
    center(d, 2605, PAGES_URL.replace("https://", ""), regular(44), GRAY)

    # 图例
    y = 2790
    for c, color in ((tax["categories"][0], GREEN), (tax["categories"][1], ORANGE)):
        d.ellipse([MARGIN, y + 14, MARGIN + 56, y + 70], fill=color)
        d.text((MARGIN + 86, y), c["label"], font=bold(72), fill=INK)
        d.text((MARGIN + 380, y + 10), " · ".join(s["label"] for s in c["subtypes"]), font=regular(56), fill=INK)
        y += 130

    center(d, 3080, "按距离找最近的点 · 一键高德导航 · 大字模式", regular(60), GREEN)

    # 页脚
    d.line([MARGIN, 3240, W - MARGIN, 3240], fill=(226, 228, 222), width=4)
    center(d, 3290, "点位来自实地走访和骑手指认 · 信息不准欢迎在网页里反馈", regular(48), GRAY)
    center(d, 3370, "复旦大学计算与智能创新学院 · 2026 年秋季社会实践", regular(48), GRAY)

    out_png = ROOT / "docs" / "海报.png"
    img.save(out_png, dpi=(300, 300))
    img.save(ROOT / "docs" / "海报.pdf", resolution=300)
    print(f"已生成 {out_png.relative_to(ROOT)} 和 docs/海报.pdf（二维码 → {PAGES_URL}）")


if __name__ == "__main__":
    main()

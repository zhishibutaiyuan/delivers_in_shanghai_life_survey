"""用无界面浏览器（Edge / Chrome）给网页截图，供调研手册和 README 使用。

用法：python tools/take_screenshots.py
输出：docs/screenshots/desktop.png、mobile.png、mobile-detail.png
数据更新后重新运行，再运行 build_handbook.py，手册里的截图就是最新的。
"""
import functools
import http.server
import shutil
import urllib.parse
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

from common import ROOT, load_points

OUT_DIR = ROOT / "docs" / "screenshots"
CANDIDATES = [
    Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
    Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
    Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    Path("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),
]


def find_browser():
    for p in CANDIDATES:
        if p.exists():
            return str(p)
    for name in ("msedge", "google-chrome", "chromium", "chromium-browser", "chrome"):
        found = shutil.which(name)
        if found:
            return found
    sys.exit("找不到 Edge 或 Chrome，无法截图")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        # /__frame?w=390&h=844&u=...：把网页放进指定大小的 iframe。
        # 无界面浏览器的窗口最窄约 500 像素，手机宽度只能这样模拟，截图后再裁剪。
        if self.path.startswith("/__frame"):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            w, h, u = q["w"][0], q["h"][0], q["u"][0]
            body = (f'<!doctype html><body style="margin:0"><iframe src="{u}" '
                    f'style="border:0;display:block;width:{w}px;height:{h}px"></iframe>').encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


def main():
    browser = find_browser()
    _, _, points = load_points()
    first_rest = next((p["id"] for p in points if p["category"] == "rest"), points[0]["id"] if points else "")

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_address[1]}"
    base = f"{origin}/index.html"

    # (文件名, 网页宽高(CSS 像素), 像素倍率, 网址)。手机截图用 2 倍像素密度，图片更清晰。
    shots = [
        ("desktop.png", (1280, 800), 1, base),
        ("mobile.png", (390, 844), 2, base),
        ("mobile-detail.png", (390, 844), 2, f"{base}#p={first_rest}"),
    ]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as profile:  # 独立的临时配置，不影响正在使用的浏览器
        for name, (w, h), scale, url in shots:
            out = OUT_DIR / name
            narrow = w < 600
            target = (f"{origin}/__frame?w={w}&h={h}&u={urllib.parse.quote(url, safe='')}" if narrow else url)
            win_w, win_h = (max(w, 600), h + 200) if narrow else (w, h)
            subprocess.run([
                browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
                f"--user-data-dir={profile}", f"--window-size={win_w},{win_h}",
                f"--force-device-scale-factor={scale}",
                "--virtual-time-budget=10000", f"--screenshot={out}", target,
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=120)
            if narrow:
                from PIL import Image
                with Image.open(out) as im:
                    im.crop((0, 0, w * scale, h * scale)).save(out)
            print(f"已截图 {out.relative_to(ROOT)}")
    server.shutdown()


if __name__ == "__main__":
    main()

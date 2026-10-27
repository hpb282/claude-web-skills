"""Gộp src/ thành một file HTML duy nhất: dist/van-vui-ai.html.

Chạy: python3 tools/build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "dist" / "van-vui-ai.html"


def main():
    html = (SRC / "index.html").read_text(encoding="utf-8")

    def inline_css(m):
        css = (SRC / m.group(1)).read_text(encoding="utf-8")
        return "<style>\n" + css + "\n</style>"

    def inline_js(m):
        js = (SRC / m.group(1)).read_text(encoding="utf-8")
        js = js.replace("</script", "<\\/script")
        return "<script>\n/* " + m.group(1) + " */\n" + js + "\n</script>"

    html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', inline_css, html)
    html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_js, html)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"Đã tạo {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()

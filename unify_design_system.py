"""
unify_design_system.py
======================
將所有 HTML 檔案的內部 tailwind.config <script> 和
<style type="text/tailwindcss"> 區塊移除，
並在 <head> 內自動注入：
  1. design-tokens.css
  2. css/vibe-style.css
  3. js/theme-config.js（放在 Tailwind CDN 之後）

使用方式：
    python unify_design_system.py          # 預覽（dry run）
    python unify_design_system.py --apply  # 正式執行
"""

import os
import re
import sys
import glob
import shutil

BASE = os.path.dirname(os.path.abspath(__file__))
DRY_RUN = "--apply" not in sys.argv

# ── 要注入的 <link> 標籤（插在 <head> 之後第一行） ──────
INJECT_LINKS = (
    '    <link rel="stylesheet" href="design-tokens.css">\n'
    '    <link rel="stylesheet" href="css/vibe-style.css">\n'
)

# theme-config.js 要插在 Tailwind CDN <script> 之後
INJECT_THEME = '    <script src="js/theme-config.js"></script>\n'

# ── Regex：移除 <script id="tailwind-config"> ... </script> ──
RE_TAILWIND_CONFIG = re.compile(
    r'\s*<script[^>]*id=["\']tailwind-config["\'][^>]*>.*?</script>',
    re.DOTALL
)

# ── Regex：移除 <style type="text/tailwindcss"> ... </style> ──
RE_TAILWIND_STYLE = re.compile(
    r'\s*<style[^>]*type=["\']text/tailwindcss["\'][^>]*>.*?</style>',
    re.DOTALL
)

# ── Regex：Tailwind CDN <script src="...tailwindcss..."> ──
RE_TAILWIND_CDN = re.compile(
    r'(<script[^>]*cdn\.tailwindcss\.com[^>]*></script>)'
)


def process(filepath: str) -> list[str]:
    with open(filepath, "r", encoding="utf-8") as f:
        src = f.read()

    original = src
    log = []

    # 1. 移除舊的 tailwind-config script
    src, n = RE_TAILWIND_CONFIG.subn("", src)
    if n:
        log.append(f"  [-] 移除 <script id=tailwind-config>  ({n})")

    # 2. 移除舊的 <style type=text/tailwindcss>
    src, n = RE_TAILWIND_STYLE.subn("", src)
    if n:
        log.append(f"  [-] 移除 <style type=text/tailwindcss>  ({n})")

    # 3. 注入 design-tokens.css + vibe-style.css（若尚未存在）
    if "vibe-style.css" not in src:
        src = src.replace("<head>", "<head>\n" + INJECT_LINKS, 1)
        log.append("  [+] 注入 design-tokens.css + css/vibe-style.css")
    else:
        log.append("  [=] vibe-style.css 已存在，跳過注入")

    # 4. 注入 theme-config.js 在 Tailwind CDN 之後
    if "theme-config.js" not in src:
        src = RE_TAILWIND_CDN.sub(r"\1\n" + INJECT_THEME, src, count=1)
        log.append("  [+] 注入 js/theme-config.js（Tailwind CDN 之後）")
    else:
        log.append("  [=] theme-config.js 已存在，跳過注入")

    if not DRY_RUN and src != original:
        shutil.copy2(filepath, filepath + ".bak2")
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(src)

    return log


def main():
    mode = "🔍 [預覽]" if DRY_RUN else "✅ [執行]"
    print(f"{mode} 統一設計系統到所有 HTML 檔案\n" + "=" * 55)

    files = sorted(glob.glob(os.path.join(BASE, "*.html")))
    changed = 0

    for fp in files:
        name = os.path.basename(fp)
        logs = process(fp)
        has_change = any(l.startswith("  [+]") or l.startswith("  [-]") for l in logs)
        if has_change:
            changed += 1
            status = "（已修改）" if not DRY_RUN else "（待修改）"
        else:
            status = "— 無需修改"
        print(f"\n📄 {name} {status}")
        for l in logs:
            print(l)

    print("\n" + "=" * 55)
    print(f"📊 共 {changed} / {len(files)} 個檔案需要修改")
    if DRY_RUN:
        print("\n💡 確認無誤後執行：python unify_design_system.py --apply")


if __name__ == "__main__":
    main()

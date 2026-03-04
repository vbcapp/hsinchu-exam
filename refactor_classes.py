"""
refactor_classes.py — 批量替換 HTML 中的長串 Tailwind class 為語義化組件 class
=============================================================================

執行：
    python -X utf8 refactor_classes.py           # 預覽
    python -X utf8 refactor_classes.py --apply    # 正式執行
"""
import glob, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
DRY_RUN = "--apply" not in sys.argv

# 取得所有 HTML 檔案（排除 bak）
html_files = sorted(glob.glob(os.path.join(BASE, '*.html')))

# ── 替換規則 ──────────────────────────────────────────────
# (搜尋模式, 取代結果, 說明)
REPLACEMENTS = [
    # =============== Section Label ===============
    (
        r'class="bg-primary inline-block neo-border px-4 py-1 neo-shadow-sm mb-4"',
        'class="vibe-section-label"',
        'section-label'
    ),
    # =============== Badge ===============
    (
        r'class="bg-primary neo-border px-1\.5 py-0\.5 text-\[8px\] font-bold uppercase"',
        'class="vibe-badge"',
        'badge'
    ),
    (
        r'class="bg-yellow-500 border-2 border-black text-white px-1\.5 py-0\.5 text-\[8px\] font-bold uppercase"',
        'class="vibe-badge-mastery"',
        'badge-mastery'
    ),

    # =============== neo-brutalism-button 系列（最大量） ===============

    # 全寬 primary 按鈕 (border-4, 各種變體)
    (
        r'class="w-full bg-primary border-4 border-black py-(\d+)(?:\s+px-\d+)? font-black(?:\s+italic)?(?:\s+text-(?:xl|sm|center|lg))*(?:\s+uppercase)?(?:\s+tracking-widest)? neo-brutalism-button(?:\s+shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\])?(?:\s+flex\s+items-center\s+justify-center(?:\s+gap-2)?)?(?:\s+disabled:opacity-50\s+disabled:cursor-not-allowed(?:\s+disabled:shadow-none)?)?(?:\s+hover:translate-x-\[2px\]\s+hover:translate-y-\[2px\]\s+hover:shadow-\[2px_2px_0px_0px_rgba\(0,0,0,1\)\]\s+transition-all)?"',
        'class="vibe-btn vibe-btn-primary"',
        'btn-primary (border-4)'
    ),
    # 全寬 primary (neo-border 版)
    (
        r'class="w-full bg-primary neo-border py-3 text-sm font-black uppercase neo-shadow-sm hover:translate-x-\[1px\] hover:translate-y-\[1px\] hover:shadow-none transition-all"',
        'class="vibe-btn vibe-btn-primary"',
        'btn-primary (neo-border)'
    ),
    # 全寬 secondary (neo-border 版)
    (
        r'class="w-full bg-white(?:\s+dark:bg-zinc-700)? neo-border py-3 text-sm font-black uppercase neo-shadow-sm hover:translate-x-\[1px\] hover:translate-y-\[1px\] hover:shadow-none transition-all"',
        'class="vibe-btn vibe-btn-secondary"',
        'btn-secondary (neo-border)'
    ),
    # flex-1 primary 按鈕 (modal confirm 等)
    (
        r'class="flex-1 bg-primary border-4 border-black py-3 font-black neo-brutalism-button(?:\s+shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\])?"',
        'class="vibe-btn vibe-btn-primary flex-1"',
        'btn-primary flex-1'
    ),
    # flex-1 secondary 按鈕 (modal cancel 等)
    (
        r'class="flex-1 bg-white border-4 border-black py-3 font-black neo-brutalism-button(?:\s+shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\])?"',
        'class="vibe-btn vibe-btn-secondary flex-1"',
        'btn-secondary flex-1'
    ),
    # 全寬 green 按鈕
    (
        r'class="w-full bg-green-500 text-white border-4 border-black py-3 px-4 font-black text-center neo-brutalism-button shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\](?:\s+mt-4)?(?:\s+hover:bg-green-600)?"',
        'class="vibe-btn bg-green-500 text-white mt-4 hover:bg-green-600"',
        'btn-success (green)'
    ),
    # 全寬 blue 按鈕
    (
        r'class="w-full bg-blue-500 text-white border-4 border-black py-3 px-4 font-black text-center neo-brutalism-button shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\](?:\s+mt-4)?(?:\s+hover:bg-blue-600)?"',
        'class="vibe-btn bg-blue-500 text-white mt-4 hover:bg-blue-600"',
        'btn-info (blue)'
    ),
    # 全寬 purple 按鈕
    (
        r'class="w-full bg-purple-500 text-white border-4 border-black py-3 px-4 font-black text-center neo-brutalism-button shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\](?:\s+mt-4)?(?:\s+hover:bg-purple-600)?"',
        'class="vibe-btn bg-purple-500 text-white mt-4 hover:bg-purple-600"',
        'btn-purple'
    ),

    # =============== 小型按鈕 (admin toolbar 等) ===============
    # bg-primary toolbar btn
    (
        r'class="bg-primary border-4 border-black px-3 py-2 font-black text-sm neo-brutalism-button shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\] flex items-center gap-(?:1|2)"',
        'class="vibe-btn vibe-btn-primary text-sm px-3 py-2 w-auto flex items-center gap-1"',
        'toolbar btn primary'
    ),
    # bg-white toolbar btn
    (
        r'class="bg-white border-4 border-black px-3 py-2 font-black text-sm neo-brutalism-button shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\] flex items-center gap-1(?:\s+disabled:opacity-50\s+disabled:cursor-not-allowed)?"',
        'class="vibe-btn vibe-btn-secondary text-sm px-3 py-2 w-auto flex items-center gap-1"',
        'toolbar btn secondary'
    ),

    # =============== Icon-style neo-brutalism button ===============
    # bg-white 返回按鈕
    (
        r'class="bg-white border-4 border-black p-2 neo-brutalism-button shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\](?:\s+cursor-pointer)?(?:\s+hover:scale-105)?(?:\s+transition-transform)?"',
        'class="vibe-icon-btn bg-white" style="width:auto;height:auto;border-width:4px"',
        'icon-back-btn'
    ),
    # bg-primary icon btn (rule.html logo)
    (
        r'class="bg-primary border-4 border-black p-1 neo-brutalism-button shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\] flex items-center justify-center"',
        'class="vibe-icon-btn" style="border-width:4px"',
        'icon-logo-btn'
    ),

    # =============== Filter chip ===============
    (
        r'class="filter-btn flex-none px-4 py-2 neo-border-thick bg-primary font-black text-xs neo-shadow-sm active"',
        'class="filter-btn vibe-filter-btn active"',
        'filter-btn active'
    ),
    (
        r'class="filter-btn flex-none px-4 py-2 neo-border-thick bg-white(?:\s+dark:bg-zinc-800)? font-bold text-xs neo-shadow-sm(?:\s+text-red-500)?"',
        'class="filter-btn vibe-filter-btn"',
        'filter-btn'
    ),

    # =============== Icon button (小型) ===============
    (
        r'class="w-10 h-10 neo-border-thick bg-primary flex items-center justify-center neo-shadow-sm active:shadow-none active:translate-x-\[1px\] active:translate-y-\[1px\](?:\s+hidden)?"',
        'class="vibe-icon-btn"',
        'icon-btn'
    ),

    # =============== 全寬 gray 按鈕 ===============
    (
        r'class="(?:mt-3 )?w-full bg-gray-100 border-4 border-black py-2 font-black neo-brutalism-button shadow-\[4px_4px_0px_0px_rgba\(0,0,0,1\)\](?:\s+hover:bg-gray-200)?"',
        'class="vibe-btn vibe-btn-secondary bg-gray-100 hover:bg-gray-200 mt-3"',
        'btn-gray'
    ),
]


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        src = f.read()

    original = src
    logs = []

    for pattern, replacement, label in REPLACEMENTS:
        new_src, count = re.subn(pattern, replacement, src)
        if count > 0:
            logs.append(f"  [{count}x] {label}")
            src = new_src

    changed = src != original
    if not DRY_RUN and changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(src)

    return logs, changed


def main():
    mode = "🔍 [預覽]" if DRY_RUN else "✅ [執行]"
    print(f"{mode} 批量替換 Tailwind class 為語義化組件")
    print("=" * 55)

    total_changed = 0
    for fp in html_files:
        fname = os.path.basename(fp)
        logs, changed = process_file(fp)
        if changed:
            total_changed += 1
            status = "（已修改）" if not DRY_RUN else "（待修改）"
            print(f"\n📄 {fname} {status}")
            for l in logs:
                print(l)

    print(f"\n{'='*55}")
    print(f"📊 共 {total_changed} / {len(html_files)} 個檔案{'已修改' if not DRY_RUN else '待修改'}")
    if DRY_RUN:
        print("💡 確認後執行：python -X utf8 refactor_classes.py --apply")


if __name__ == '__main__':
    main()

"""
vibe_card_replace.py — 全域替換 bg-white border-4 border-black p-4 → .vibe-card
=============================================================================
把各式 neo-brutalism-card + border/bg/p 組合統一替換為 .vibe-card

執行：
    python -X utf8 vibe_card_replace.py           # 預覽
    python -X utf8 vibe_card_replace.py --apply    # 正式執行
"""
import glob, os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))
DRY_RUN = "--apply" not in sys.argv

# 只處理根目錄的 HTML（排除 preview/ 子目錄）
html_files = sorted(glob.glob(os.path.join(BASE, '*.html')))
# 加上 JS 檔案
js_files = sorted(glob.glob(os.path.join(BASE, 'js', '*.js')))

# ── 替換規則清單 ─────────────────────────────────────────────
# 每條規則是 (regex_pattern, replacement_class_string)
# 注意：順序很重要，長的 pattern 先匹配

RULES = [
    # 1. bg-white dark:bg-gray-800 border-4 border-black p-4 space-y-4 neo-brutalism-card
    (r'bg-white\s+dark:bg-gray-800\s+border-4\s+border-black\s+p-4\s+space-y-4\s+neo-brutalism-card',
     'vibe-card dark:bg-gray-800 space-y-4'),

    # 2. bg-white dark:bg-gray-800 border-4 border-black p-4 flex justify-between items-center neo-brutalism-card
    (r'bg-white\s+dark:bg-gray-800\s+border-4\s+border-black\s+p-4\s+flex\s+justify-between\s+items-center\s+neo-brutalism-card',
     'vibe-card dark:bg-gray-800 flex justify-between items-center'),

    # 3. bg-white dark:bg-gray-800 border-4 border-black p-4 neo-brutalism-card
    (r'bg-white\s+dark:bg-gray-800\s+border-4\s+border-black\s+p-4\s+neo-brutalism-card',
     'vibe-card dark:bg-gray-800'),

    # 4. bg-primary border-4 border-black p-4 neo-brutalism-card
    (r'bg-primary\s+border-4\s+border-black\s+p-4\s+neo-brutalism-card',
     'vibe-card bg-primary'),

    # 5. bg-white border-4 border-black p-4 neo-brutalism-card space-y-4
    (r'bg-white\s+border-4\s+border-black\s+p-4\s+neo-brutalism-card\s+space-y-4',
     'vibe-card space-y-4'),

    # 6. bg-white border-4 border-black p-4 neo-brutalism-card
    (r'bg-white\s+border-4\s+border-black\s+p-4\s+neo-brutalism-card',
     'vibe-card'),

    # 7. bg-white border-4 border-black p-4 flex items-center justify-between neo-shadow-sm
    (r'bg-white\s+border-4\s+border-black\s+p-4\s+flex\s+items-center\s+justify-between\s+neo-shadow-sm',
     'vibe-card neo-shadow-sm flex items-center justify-between'),

    # 8. bg-white border-4 border-black p-4 neo-shadow-sm flex flex-col gap-2
    (r'bg-white\s+border-4\s+border-black\s+p-4\s+neo-shadow-sm\s+flex\s+flex-col\s+gap-2',
     'vibe-card neo-shadow-sm flex flex-col gap-2'),

    # 9. bg-white border-4 border-black p-4 space-y-3 text-sm
    (r'bg-white\s+border-4\s+border-black\s+p-4\s+space-y-3\s+text-sm',
     'vibe-card space-y-3 text-sm'),

    # 10. JS: tag-item bg-white border-4 border-black p-4 neo-brutalism-card flex items-center justify-between
    (r'tag-item\s+bg-white\s+border-4\s+border-black\s+p-4\s+neo-brutalism-card\s+flex\s+items-center\s+justify-between',
     'tag-item vibe-card flex items-center justify-between'),

    # 11. subject-group bg-white border-4 border-black neo-brutalism-card
    (r'subject-group\s+bg-white\s+border-4\s+border-black\s+neo-brutalism-card',
     'subject-group vibe-card'),

    # 12. hidden bg-white dark:bg-gray-800 border-4 border-black p-4 space-y-4 neo-brutalism-card
    (r'hidden\s+bg-white\s+dark:bg-gray-800\s+border-4\s+border-black\s+p-4\s+space-y-4\s+neo-brutalism-card',
     'hidden vibe-card dark:bg-gray-800 space-y-4'),
]


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        src = f.read()

    original = src
    logs = []

    for pattern, replacement in RULES:
        new_src = re.sub(pattern, replacement, src)
        count = len(re.findall(pattern, src))
        if count > 0:
            logs.append(f'  [{count}x] {replacement[:60]}')
            src = new_src

    changed = src != original

    if not DRY_RUN and changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(src)

    return logs, changed


def main():
    mode = "Preview" if DRY_RUN else "APPLY"
    print(f"[{mode}] vibe-card global replacement")
    print("=" * 55)

    total = 0
    all_files = html_files + js_files
    for fp in all_files:
        fname = os.path.relpath(fp, BASE)
        logs, changed = process_file(fp)
        if logs:
            total += 1 if changed else 0
            print(f"\n {fname}")
            for l in logs:
                print(l)

    print(f"\n{'='*55}")
    print(f"Total: {total} files {'modified' if not DRY_RUN else 'to modify'}")
    if DRY_RUN:
        print("Run: python -X utf8 vibe_card_replace.py --apply")


if __name__ == '__main__':
    main()

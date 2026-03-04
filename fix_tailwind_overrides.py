"""
fix_tailwind_overrides.py
=========================
移除所有 HTML 中沒有 id="tailwind-config" 的本地 tailwind.config 覆蓋 script 區塊，
同時修正 <style> 區塊中的硬編碼顏色 (#FFD600 / #ffd400 / #EEEEEE 等)。

執行：
    python fix_tailwind_overrides.py           # 預覽
    python fix_tailwind_overrides.py --apply   # 正式執行
"""
import glob, os, re, sys, shutil

BASE = os.path.dirname(os.path.abspath(__file__))
DRY_RUN = "--apply" not in sys.argv

# 只針對有問題的檔案
TARGET_FILES = [
    'admin.html','create.html','edit.html','history-analysis.html',
    'import.html','level.html','profile.html','rank.html',
    'rank_l.html','rank_n.html','result.html','rule.html',
    'test.html','weakness.html',
]

# Regex：移除沒有 id="tailwind-config" 的 <script>tailwind.config = {...}</script>
# 這種 script 只包含 tailwind.config，且緊接著 <script> 沒有任何 attribute
RE_PLAIN_CONFIG = re.compile(
    r'\n?[ \t]*<script>\s*tailwind\.config\s*=\s*\{.*?\}\s*;\s*</script>',
    re.DOTALL
)

# 在 <style> 區塊內修正硬編碼顏色
STYLE_COLOR_REPLACEMENTS = [
    # (搜尋, 取代)
    ('#FFD600',  'var(--color-primary)'),
    ('#ffd600',  'var(--color-primary)'),
    ('#FFD400',  'var(--color-primary)'),
    ('#ffd400',  'var(--color-primary)'),
    ('#FF3B30',  'var(--color-danger)'),
    ('#ff3b30',  'var(--color-danger)'),
    ('4px 4px 0px 0px rgba(0,0,0,1)', 'var(--card-shadow)'),
    ('8px 8px 0px 0px rgba(0, 0, 0, 1)', 'var(--card-shadow-lg)'),
    ('4px solid black', 'var(--border-heavy)'),
    ('3px solid black', 'var(--border-thick)'),
    ('2px solid black', 'var(--border-base)'),
    ('3px solid #000', 'var(--border-thick)'),
    ('2px solid #000', 'var(--border-base)'),
    ('border-bottom: 3px solid #000000', 'border-bottom: var(--border-bottom-thick)'),
    # shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] → neo-shadow (在 <style> 塊內不常見，但也一起處理)
]


def fix_style_blocks(src: str) -> tuple[str, list[str]]:
    """在 <style> 塊內取代硬編碼值"""
    logs = []
    
    def replace_in_style(m: re.Match) -> str:
        block = m.group(0)
        for old, new in STYLE_COLOR_REPLACEMENTS:
            count = block.count(old)
            if count:
                block = block.replace(old, new)
                logs.append(f"  [style] {old!r} → {new!r}  ({count})")
        return block
    
    new_src = re.sub(r'<style[^>]*>.*?</style>', replace_in_style, src, flags=re.DOTALL)
    return new_src, logs


def process(filepath: str):
    with open(filepath, 'r', encoding='utf-8') as f:
        src = f.read()
    
    original = src
    logs = []

    # 1. 移除 plain tailwind.config script
    new_src, n = RE_PLAIN_CONFIG.subn('', src)
    if n:
        logs.append(f"  [-] 移除本地 tailwind.config 覆蓋 script  ({n})")
        src = new_src
    
    # 2. 修正 <style> 內的硬編碼
    src, style_logs = fix_style_blocks(src)
    logs.extend(style_logs)
    
    changed = src != original
    if not DRY_RUN and changed:
        shutil.copy2(filepath, filepath + '.fix.bak')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(src)
    
    return logs, changed


def main():
    mode = "🔍 [預覽]" if DRY_RUN else "✅ [執行]"
    print(f"{mode} 修正 Tailwind Config 覆蓋問題\n" + "=" * 55)
    
    fixed = 0
    for fname in TARGET_FILES:
        fp = os.path.join(BASE, fname)
        if not os.path.exists(fp):
            print(f"\n⚠️  {fname} 不存在，跳過")
            continue
        
        logs, changed = process(fp)
        status = "（已修改）" if (changed and not DRY_RUN) else "（待修改）" if changed else "— 無需修改"
        print(f"\n📄 {fname} {status}")
        for l in logs:
            print(l)
        if changed:
            fixed += 1
    
    print(f"\n{'='*55}")
    print(f"📊 共 {fixed} / {len(TARGET_FILES)} 個檔案需要修改")
    if DRY_RUN:
        print("💡 確認後執行：python fix_tailwind_overrides.py --apply")


if __name__ == '__main__':
    main()

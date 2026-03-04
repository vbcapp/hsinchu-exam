import os, glob, re

base = r'c:\Users\USER\Desktop\text\sandys-exam-card-system'
files = glob.glob(os.path.join(base, '*.html'))
tag = '<link rel="stylesheet" href="design-tokens.css">'
fixed = 0

for fp in files:
    with open(fp, 'r', encoding='utf-8') as f:
        src = f.read()
    
    count = src.count(tag)
    if count > 1:
        # 保留第一個，移除後續重複整行
        idx = src.find(tag)          # 第一個位置
        idx2 = src.find(tag, idx+1) # 第二個位置
        while idx2 != -1:
            line_start = src.rfind('\n', 0, idx2)
            line_end   = src.find('\n', idx2)
            if line_end == -1: line_end = len(src)
            src = src[:line_start] + src[line_end:]
            idx2 = src.find(tag, idx+1)
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(src)
        print(f'fixed: {os.path.basename(fp)} ({count} -> 1)')
        fixed += 1

print(f'Done. Total fixed: {fixed}')

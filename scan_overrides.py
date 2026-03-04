import glob, os, re

base = r'c:\Users\USER\Desktop\text\sandys-exam-card-system'
files = glob.glob(os.path.join(base, '*.html'))

for fp in sorted(files):
    with open(fp, 'r', encoding='utf-8') as f:
        src = f.read()
    if 'tailwind.config' in src:
        has_id = bool(re.search(r"<script[^>]*id=[\"']tailwind-config[\"'][^>]*>", src))
        has_plain = bool(re.search(r'<script>\s*tailwind\.config', src))
        print(f"{os.path.basename(fp):35s}  id={has_id}  plain-override={has_plain}")
    else:
        print(f"{os.path.basename(fp):35s}  [已清理 OK]")

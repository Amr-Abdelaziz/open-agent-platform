import re

def find_dupes(text):
    keys = re.findall(r'^\s+(\w+):', text, re.MULTILINE)
    seen = set()
    dupes = []
    for k in keys:
        if k in seen:
            dupes.append(k)
        seen.add(k)
    return dupes

with open('apps/web/src/providers/Language.tsx', 'r') as f:
    content = f.read()

en_start = content.find('en: {')
ar_start = content.find('ar: {')
last_brace = content.rfind('}')

en_content = content[en_start:ar_start]
ar_content = content[ar_start:last_brace]

print('EN dupes:', find_dupes(en_content))
print('AR dupes:', find_dupes(ar_content))

import re, json
with open('Ta.kt', 'r', encoding='utf-8') as f:
    text = f.read()
matches = re.findall(r'(K\.[a-zA-Z0-9_]+)\s+to\s+TaVar\(\s*ta\s*=\s*\"(.*?)\"', text, re.DOTALL)
res = [[k, v.replace('\n', '\\n')] for k, v in matches]
with open('keys.json', 'w', encoding='utf-8') as f:
    json.dump(res, f, ensure_ascii=False)

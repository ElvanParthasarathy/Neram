import json, re

with open('keys.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

vocab = {
    "முகப்பு": "മുഖപ്പ്",
    "நேரங்கள்": "നേരങ്ങൾ",
    "நேரத்தைத்": "നേരത്തെ",
    "நேரத்திற்கு": "നേരത്തിലേക്ക്",
    "நேரத்தை": "നേരത്തെ",
    "நேரம்": "നേരം",
    "அட்டவணையை": "നേരപ്പട്ടികയെ",
    "அட்டவணைத்": "നേരപ്പട്ടിക",
    "அட்டவணை": "നേരപ്പട്ടിക",
    "நாட்காட்டி": "നാൾവഴി",
    "குறிப்பகம்": "കുറിപ്പകം",
    "குறிப்புகள்": "കുറിപ്പുകൾ",
    "குறிப்பு": "കുറിപ്പ്",
    "அறிவிப்புகளைப்": "അറിയിപ്പുകളെ",
    "அறிவிப்புகள்": "അറിയിപ്പുകൾ",
    "அறிவிப்பைச்": "അറിയിപ്പിനെ",
    "அறிவிப்பு": "അറിയിപ്പ്",
    "அமைப்புகள்": "ഒരുക്കങ്ങൾ",
    "அமைப்பு": "ഒരുക്കം",
    "தன்னுரை": "തൻവിവരം",
    "கையாளுநர்": "കാര്യസ്ഥൻ",
    "இயல்புநிலை": "പതിവുനില",
    "மாணவர்கள்": "പഠിതാക്കൾ",
    "மாணவர்": "പഠിതാവ്",
    "ஆசிரியர்": "അധ്യാപകൻ",
    "விடுமுறைகள்": "അവധികൾ",
    "விடுமுறை": "അവധി",
    "தேர்வுகள்": "പരീക്ഷകൾ",
    "தேர்வுக்கு": "പരീക്ഷയ്ക്ക്",
    "தேர்வு": "പരീക്ഷ",
    "வகுப்புகள்": "ക്ലാസ്സുകൾ",
    "வகுப்பில்லை": "ക്ലാസ്സില്ല",
    "வகுப்பு": "ക്ലാസ്സ്",
    "கருத்துகள் & வினவல்கள்": "അഭിപ്രായങ്ങളും സംശയങ്ങളും",
    "இணையமில்லை": "ഇണയമില്ല",
    "இணையம்": "ഇണയം"
}

def replace_vocab(text):
    for k, v in vocab.items():
        text = text.replace(k, v)
    return text

def ta_to_ml(text):
    text = replace_vocab(text)
    
    sandhi_consonants = ['க', 'ச', 'த', 'ப']
    sb = []
    i = 0
    n = len(text)
    while i < n:
        c = text[i]
        if c in sandhi_consonants and i + 2 < n and text[i+1] == '\u0BCD' and text[i+2] == ' ' and i + 3 < n and text[i+3] == c:
            sb.append(' ')
            sb.append(c)
            sb.append('\u0BCD')
            i += 3
        else:
            sb.append(c)
            i += 1
    
    processed = ''.join(sb)
    
    sb = []
    i = 0
    n = len(processed)
    while i < n:
        c = processed[i]
        has_virama = (i + 1 < n and processed[i+1] == '\u0BCD')
        next_after = processed[i+2] if has_virama and i+2 < n else None
        
        if has_virama:
            if c == '\u0BAE': # ம்
                if next_after in ['\u0BAA', '\u0BAE']:
                    sb.append('\u0D2E\u0D4D')
                elif next_after is None or next_after == ' ' or next_after in "\n\t.,;:!?()[]{}\"'-_/":
                    sb.append('\u0D02')
                else:
                    sb.append('\u0D02')
                i += 2
                continue
            elif c == '\u0BA9': # ன்
                if next_after == '\u0BB1':
                    sb.append('\u0D28\u0D4D\u0D31')
                    i += 3; continue
                elif next_after == '\u0BA9':
                    sb.append('\u0D28\u0D4D\u0D28')
                    i += 3; continue
                else:
                    sb.append('\u0D7B')
                    i += 2; continue
            elif c == '\u0BA3': # ண்
                if next_after == '\u0B9F':
                    sb.append('\u0D23\u0D4D\u0D1F')
                    i += 3; continue
                elif next_after == '\u0BA3':
                    sb.append('\u0D23\u0D4D\u0D23')
                    i += 3; continue
                else:
                    sb.append('\u0D7A')
                    i += 2; continue
            elif c == '\u0BB0': # ர்
                sb.append('\u0D7C')
                i += 2; continue
            elif c == '\u0BB2': # ல்
                if next_after == '\u0BB2':
                    sb.append('\u0D32\u0D4D\u0D32')
                    i += 3; continue
                else:
                    sb.append('\u0D7D')
                    i += 2; continue
            elif c == '\u0BB3': # ள்
                if next_after == '\u0BB3':
                    sb.append('\u0D33\u0D4D\u0D33')
                    i += 3; continue
                else:
                    sb.append('\u0D7E')
                    i += 2; continue

        cmap = {
            '\u0B85': '\u0D05', '\u0B86': '\u0D06', '\u0B87': '\u0D07', '\u0B88': '\u0D08',
            '\u0B89': '\u0D09', '\u0B8A': '\u0D0A', '\u0B8E': '\u0D0E', '\u0B8F': '\u0D0F',
            '\u0B90': '\u0D10', '\u0B92': '\u0D12', '\u0B93': '\u0D13', '\u0B94': '\u0D14',
            '\u0B83': '\u0B83', '\u0B95': '\u0D15', '\u0B99': '\u0D19', '\u0B9A': '\u0D1A',
            '\u0B9C': '\u0D1C', '\u0B9E': '\u0D1E', '\u0B9F': '\u0D1F', '\u0BA3': '\u0D23',
            '\u0BA4': '\u0D24', '\u0BA8': '\u0D28', '\u0BA9': '\u0D28', '\u0BAA': '\u0D2A',
            '\u0BAE': '\u0D2E', '\u0BAF': '\u0D2F', '\u0BB0': '\u0D30', '\u0BB1': '\u0D31',
            '\u0BB2': '\u0D32', '\u0BB3': '\u0D33', '\u0BB4': '\u0D34', '\u0BB5': '\u0D35',
            '\u0BB6': '\u0D36', '\u0BB7': '\u0D37', '\u0BB8': '\u0D38', '\u0BB9': '\u0D39',
            '\u0BBE': '\u0D3E', '\u0BBF': '\u0D3F', '\u0BC0': '\u0D40', '\u0BC1': '\u0D41',
            '\u0BC2': '\u0D42', '\u0BC6': '\u0D46', '\u0BC7': '\u0D47', '\u0BC8': '\u0D48',
            '\u0BCA': '\u0D4A', '\u0BCB': '\u0D4B', '\u0BCC': '\u0D4C', '\u0BCD': '\u0D4D',
            '\u0BD7': '\u0D57', '\u0BD0': '\u0D13\u0D02'
        }
        sb.append(cmap.get(c, c))
        i += 1
    return ''.join(sb)

# A simple Malayalam to Manglish (latn) transliterator
def ml_to_latn(text):
    mapping = {
        'അ': 'a', 'ആ': 'aa', 'ഇ': 'i', 'ഈ': 'ee', 'ഉ': 'u', 'ഊ': 'oo',
        'എ': 'e', 'ഏ': 'ae', 'ഐ': 'ai', 'ഒ': 'o', 'ഓ': 'oa', 'ഔ': 'au',
        'ക': 'k', 'ഖ': 'kh', 'ഗ': 'g', 'ഘ': 'gh', 'ങ': 'ng',
        'ച': 'ch', 'ഛ': 'chh', 'ജ': 'j', 'ഝ': 'jh', 'ഞ': 'nj',
        'ട': 't', 'ഠ': 'th', 'ഡ': 'd', 'ഢ': 'dh', 'ണ': 'n',
        'ത': 'th', 'ഥ': 'thh', 'ദ': 'dh', 'ധ': 'dhh', 'ന': 'n',
        'പ': 'p', 'ഫ': 'ph', 'ബ': 'b', 'ഭ': 'bh', 'മ': 'm',
        'യ': 'y', 'ര': 'r', 'ല': 'l', 'വ': 'v', 'ശ': 'sh',
        'ഷ': 'sh', 'സ': 's', 'ഹ': 'h', 'ള': 'l', 'ഴ': 'zh', 'റ': 'r',
        
        'ാ': 'aa', 'ി': 'i', 'ീ': 'ee', 'ു': 'u', 'ൂ': 'oo',
        'െ': 'e', 'േ': 'ae', 'ൈ': 'ai', 'ൊ': 'o', 'ോ': 'oa', 'ൌ': 'au', 'ൗ': 'au',
        '്': '', 'ം': 'm', 'ഃ': 'h',
        
        'ൻ': 'n', 'ർ': 'r', 'ൽ': 'l', 'ൾ': 'l', 'ൺ': 'n',
        'ക്ക': 'kk', 'ച്ച': 'chch', 'ട്ട': 'tt', 'ത്ത': 'thth', 'പ്പ': 'pp'
    }
    
    res = ""
    i = 0
    while i < len(text):
        if text[i:i+2] in mapping:
            res += mapping[text[i:i+2]]
            i += 2
            continue
        c = text[i]
        if c in mapping:
            res += mapping[c]
        else:
            res += c
        
        # Add 'a' to consonants if not followed by vowel signs or virama
        if 0x0D15 <= ord(c) <= 0x0D39:
            if i + 1 >= len(text) or text[i+1] not in "ാിീുൂെേൈൊോൌൗ്":
                res += 'a'
        i += 1
        
    # Capitalize first letter, capitalize after spaces, etc.
    res = ' '.join(word.capitalize() for word in res.split(' '))
    return res

out_lines = []
out_lines.append("package com.elvan.neram.ui.mozhiyaakkam\n")
out_lines.append("data class MlVar(")
out_lines.append("    val ml: String,")
out_lines.append("    val latn: String")
out_lines.append(")\n")
out_lines.append("val ml: Map<String, MlVar> = mapOf(")

for idx, (k, ta_val) in enumerate(data):
    ml_val = ta_to_ml(ta_val)
    latn_val = ml_to_latn(ml_val)
    
    # Fix formatting issues like newlines and quotes
    ml_val_esc = ml_val.replace('"', '\\"')
    latn_val_esc = latn_val.replace('"', '\\"')
    
    comma = "," if idx < len(data) - 1 else ""
    line = f'    {k} to MlVar(\n        ml = "{ml_val_esc}",\n        latn = "{latn_val_esc}"\n    ){comma}'
    out_lines.append(line)

out_lines.append(")\n")

with open('Ml.kt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out_lines))

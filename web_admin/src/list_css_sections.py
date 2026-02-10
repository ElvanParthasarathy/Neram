
import re
import os

def list_sections(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex for standard header
    # /* ==========================================================================
    #    TITLE
    #    ========================================================================== */
    pattern = re.compile(r'/\* ={10,}\s*\n\s*(.*?)\s*\n\s*={10,}\s*\*/', re.DOTALL)
    
    matches = pattern.finditer(content)
    
    print(f"--- Sections in {os.path.basename(file_path)} ---")
    for m in matches:
        title = m.group(1).strip()
        print(f"Found: {title}")

list_sections('d:\\Projects\\React\\Neram\\web\\src\\App.css')
list_sections('d:\\Projects\\React\\Neram\\web\\src\\index.css')

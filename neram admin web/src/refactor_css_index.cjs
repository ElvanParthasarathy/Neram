
const fs = require('fs');
const path = require('path');

const SOURCE_FILE = 'index.css';
const TARGET_DIR = 'styles';
const MEDIA_QUERY_START = '@media (min-width: 769px) {';
const MEDIA_QUERY_END = '}';

// Do NOT clean TARGET_DIR this time, as we want to add to it.
if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR);
}

function sanitizeName(title) {
    const t = title.toLowerCase();

    // Index.css specific
    if (t.includes('token')) return 'tokens.css';
    if (t.includes('global system')) return 'global.css';
    if (t.includes('scrollbar')) return 'scrollbar.css';
    if (t.includes('sidebar')) return 'sidebar.css';
    if (t.includes('profile')) return 'profile.css';
    if (t.includes('preview') && t.includes('badge')) return 'preview-badge.css';
    if (t.includes('preview') && t.includes('system')) return 'preview-system.css';
    if (t.includes('sync')) return 'sync.css';
    if (t.includes('mobile')) return 'responsive.css';
    if (t.includes('dark mode')) return 'theme-dark.css';

    // Fallback
    return t.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.css';
}

function processFile() {
    let content = fs.readFileSync(SOURCE_FILE, 'utf8');

    let innerContent = content;
    let hasMediaQuery = false;

    if (content.includes(MEDIA_QUERY_START)) {
        const startIndex = content.indexOf(MEDIA_QUERY_START) + MEDIA_QUERY_START.length;
        const endIndex = content.lastIndexOf('}');
        if (endIndex > startIndex) {
            innerContent = content.substring(startIndex, endIndex);
            hasMediaQuery = true;
        }
    }

    const headerRegex = /\/\* ={10,}\s*\n\s*(.*?)\s*\n\s*={10,}\s*\*\//gs;
    let match;
    let matches = [];
    while ((match = headerRegex.exec(innerContent)) !== null) {
        matches.push({
            title: match[1].trim(),
            start: match.index,
            end: match.index + match[0].length
        });
    }

    if (matches.length === 0) {
        console.log("No headers found!");
        return;
    }

    let imports = new Set();

    // Preamble
    if (matches[0].start > 0) {
        const preamble = innerContent.substring(0, matches[0].start).trim();
        if (preamble) {
            const fileName = 'base-index.css'; // Distinct from App preamble
            writeStyle(fileName, preamble, hasMediaQuery);
            imports.add(fileName);
        }
    }

    for (let i = 0; i < matches.length; i++) {
        const header = matches[i];
        const nextHeader = matches[i + 1];
        const contentStart = header.end;
        const contentEnd = nextHeader ? nextHeader.start : innerContent.length;

        const sectionContent = innerContent.substring(contentStart, contentEnd).trim();
        const fileName = sanitizeName(header.title);

        const fullContent = innerContent.substring(header.start, header.end) + '\n\n' + sectionContent;

        writeStyle(fileName, fullContent, hasMediaQuery);
        imports.add(fileName);
    }

    // Generate index_new.css
    let newIndexCss = "/* Refactored index.css */\n";
    imports.forEach(file => {
        newIndexCss += `@import './${TARGET_DIR}/${file}';\n`;
    });

    fs.writeFileSync('index_new.css', newIndexCss);
    console.log("Written index_new.css");
}

function writeStyle(filename, content, wrap) {
    let finalContent = content;
    if (wrap) {
        finalContent = `${MEDIA_QUERY_START}\n\n${content}\n\n${MEDIA_QUERY_END}`;
    }

    const filePath = path.join(TARGET_DIR, filename);
    if (fs.existsSync(filePath)) {
        fs.appendFileSync(filePath, '\n\n' + finalContent);
        console.log(`Appended to ${filename}`);
    } else {
        fs.writeFileSync(filePath, finalContent);
        console.log(`Wrote ${filename}`);
    }
}

processFile();

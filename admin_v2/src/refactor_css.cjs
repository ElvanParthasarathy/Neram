
const fs = require('fs');
const path = require('path');

const SOURCE_FILE = 'App.css';
const TARGET_DIR = 'styles';
const MEDIA_QUERY_START = '@media (min-width: 769px) {';
const MEDIA_QUERY_END = '}';

// Clean target dir
if (fs.existsSync(TARGET_DIR)) {
    fs.rmSync(TARGET_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TARGET_DIR);

function sanitizeName(title) {
    const t = title.toLowerCase();

    // Priority check
    if (t.includes('authentication') || t.includes('login') || t.includes('sign-in')) return 'auth.css';
    if (t.includes('token')) return 'tokens.css';

    // Specific pages
    if (t.includes('schedule')) return 'schedule.css';
    if (t.includes('calendar')) return 'calendar.css';
    if (t.includes('exam') && t.includes('manager')) return 'exam-manager.css';
    if (t.includes('exam') && t.includes('notice')) return 'exam-notice.css';

    // Home dashboard
    if (t.includes('home')) return 'home.css';

    // Components
    if (t.includes('button')) return 'buttons.css';
    if (t.includes('pill')) return 'components.css';
    if (t.includes('animation')) return 'animations.css';

    // Catch-all fixes
    if (t.includes('fix')) return 'fixes.css';

    // Fallback
    return t.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.css';
}

function processFile() {
    let content = fs.readFileSync(SOURCE_FILE, 'utf8');

    let innerContent = content;
    let hasMediaQuery = false;

    if (content.includes(MEDIA_QUERY_START)) {
        innerContent = content; // We'll keep the logic simple: if it's wrapped, we unwrap it conceptually 
        // But actually, finding sections inside is safer.

        // Let's just find the media query block content
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
            const fileName = 'base.css';
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

    // Generate App_refactored.css
    let newAppCss = "/* Refactored App.css */\n";
    imports.forEach(file => {
        newAppCss += `@import './${TARGET_DIR}/${file}';\n`;
    });

    fs.writeFileSync('App_new.css', newAppCss);
    console.log("Written App_new.css");
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


const fs = require('fs');
const path = require('path');

function listSections(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const pattern = /\/\* ={10,}\s*\n\s*(.*?)\s*\n\s*={10,}\s*\*\//gs;

    console.log(`--- Sections in ${path.basename(filePath)} ---`);
    let match;
    while ((match = pattern.exec(content)) !== null) {
        console.log(`Found: ${match[1].trim()}`);
    }
}

listSections('App.css');
listSections('index.css');

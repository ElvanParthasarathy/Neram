const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'RTDBLATEST .json');
const outputPath = path.join(__dirname, 'extracted_exams.json');

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

let updates = {};

if (data.schedules) {
    for (const batch of Object.keys(data.schedules)) {
        for (const dept of Object.keys(data.schedules[batch])) {
            if (dept === '_master') continue;
            for (const sec of Object.keys(data.schedules[batch][dept])) {
                if (sec === '_master' || sec === 'initialized') continue;

                const sectionData = data.schedules[batch][dept][sec];
                if (sectionData && sectionData.exams) {
                    updates[`schedules/${batch}/${dept}/${sec}/exams`] = sectionData.exams;
                }
            }
        }
    }
}

fs.writeFileSync(outputPath, JSON.stringify(updates, null, 2));
console.log("PAYLOAD_READY", Object.keys(updates).length);

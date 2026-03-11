// ─── Constants ───
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT = { 'MONDAY': 'MON', 'TUESDAY': 'TUE', 'WEDNESDAY': 'WED', 'THURSDAY': 'THU', 'FRIDAY': 'FRI', 'SATURDAY': 'SAT', 'SUNDAY': 'SUN' };
const DAY_ORDER_REGEX = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+Order\s*$/i;

/**
 * Parse all batch OCR results into structured calendar months.
 * @param {Array<{pageNum, imageDataURL, text}>} results
 * @returns {Array<{month, year, rows, sourceIdx}>}
 */
export function parseAllPages(results) {
    const months = [];
    for (let i = 0; i < results.length; i++) {
        const parsed = parsePage(results[i].text);
        if (parsed && parsed.rows.length > 0) {
            parsed.sourceIdx = i;
            months.push(parsed);
        }
    }
    return months;
}

/**
 * Parse a single page's OCR text into a structured month object.
 */
function parsePage(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return null;

    let monthName = '', year = '';
    let dataLines = [];

    for (const line of lines) {
        const upperLine = line.toUpperCase();
        if (!monthName) {
            for (const m of MONTHS) {
                if (upperLine.includes(m)) {
                    monthName = m;
                    const yrMatch = line.match(/(20\d{2})/);
                    if (yrMatch) year = yrMatch[1];
                    break;
                }
            }
            if (monthName) continue;
        }

        // Skip header-like lines
        if (upperLine.includes('DATE') && upperLine.includes('DAY')) continue;
        if (upperLine.includes('NO.') || (upperLine.includes('WORKING') && upperLine.includes('DAYS') && !upperLine.match(/^\d/))) continue;
        if (upperLine.includes('CUMULATIVE')) continue;
        if (upperLine.includes('B.E.') || upperLine.includes('B.TECH')) continue;

        dataLines.push(line);
    }

    if (!monthName) {
        monthName = 'UNKNOWN';
        year = '';
    }

    const rows = [];
    for (const line of dataLines) {
        const parsed = parseDataLine(line);
        if (parsed) {
            for (const entry of parsed) rows.push(entry);
        }
    }

    postProcessRows(rows);
    return { month: monthName, year, rows };
}

/**
 * Parse a single data line into one or more calendar entries.
 */
function parseDataLine(line) {
    const tokens = line.split(/\s+/);
    if (tokens.length < 2) return null;

    let date = '', day = '', workingDay = '', event = '', isHoliday = false;
    let idx = 0;

    // Date number (1-31)
    if (/^\d{1,2}$/.test(tokens[0])) {
        date = tokens[0];
        idx = 1;
    } else {
        return null;
    }

    // Day name
    if (idx < tokens.length) {
        const upper = tokens[idx].toUpperCase();
        const found = DAYS.find(d => upper === d || upper.startsWith(d));
        if (found) {
            day = DAY_SHORT[found] || found;
            if (day.length > 3) day = day.substring(0, 3);
            idx++;
        } else {
            return null;
        }
    }

    // Working day count
    if (idx < tokens.length && /^\d{1,3}$/.test(tokens[idx])) {
        workingDay = tokens[idx];
        idx++;
    }

    // Event description
    event = tokens.slice(idx).join(' ').trim();

    // Shorten assessment names
    event = event.replace(/\b[Ff][iI1][rR][sS][tT]?\S*\s+[Ii]nternal\s+[Aa]ss[eo]ss?ment\s+(?:[Tt]est|[Ss]ubject)\b/gi, 'FIA');
    event = event.replace(/\b[Ss][eE][cC][oO]nd\S*\s+[Ii]nternal\s+[Aa]ss[eo]ss?ment\s+(?:[Tt]est|[Ss]ubject)\b/gi, 'SIA');
    event = event.replace(/\b[Ff][iI1][rR][sS][tT]?\S*\s+[Ii]nternal\s+[Aa]ss[eo]ss?ment\b/gi, 'FIA');
    event = event.replace(/\b[Ss][eE][cC][oO]nd\S*\s+[Ii]nternal\s+[Aa]ss[eo]ss?ment\b/gi, 'SIA');

    // Split multi-event lines (day-order suffix)
    const dayOrderMatch = event.match(DAY_ORDER_REGEX);
    let entries = [];

    if (dayOrderMatch) {
        const orderDay = dayOrderMatch[1];
        const orderText = `Working Day - ${orderDay} Order`;
        let mainEvent = event.replace(DAY_ORDER_REGEX, '').trim();
        mainEvent = mainEvent.replace(/[\s\-,]+$/, '').trim();

        if (mainEvent && mainEvent.toUpperCase() !== 'WORKING DAY') {
            const mainIsHoliday = mainEvent.toUpperCase().includes('HOLIDAY');
            entries.push({ date, day, workingDay, event: mainEvent, isHoliday: mainIsHoliday });
            entries.push({ date: '', day: '', workingDay: '', event: orderText, isHoliday: false });
        } else {
            entries.push({ date, day, workingDay, event: orderText, isHoliday: false });
        }
    } else {
        if (event.toUpperCase().includes('HOLIDAY')) isHoliday = true;
        entries.push({ date, day, workingDay, event, isHoliday });
    }

    return entries;
}

/**
 * Post-process: auto-fill working days between commencement and model exam.
 */
function postProcessRows(rows) {
    let startIdx = -1;
    for (let i = 0; i < rows.length; i++) {
        const ev = rows[i].event.toUpperCase();
        if (rows[i].workingDay || ev.includes('COMMENCEMENT')) {
            startIdx = i;
            break;
        }
    }
    if (startIdx === -1) return;

    let endIdx = rows.length;
    for (let i = startIdx; i < rows.length; i++) {
        if (rows[i].event.toUpperCase().includes('MODEL')) {
            endIdx = i;
            break;
        }
    }

    for (let i = startIdx; i < endIdx; i++) {
        if (rows[i].workingDay && !rows[i].event) {
            rows[i].event = 'Working Day';
        }
    }

    autoNumberAssessments(rows, 'FIA');
    autoNumberAssessments(rows, 'SIA');
}

/**
 * Auto-number consecutive FIA/SIA entries.
 */
function autoNumberAssessments(rows, prefix) {
    let groups = [];
    let i = 0;
    while (i < rows.length) {
        const ev = rows[i].event.trim();
        if (ev.toUpperCase().startsWith(prefix)) {
            let groupStart = i;
            while (i < rows.length && rows[i].event.trim().toUpperCase().startsWith(prefix)) i++;
            groups.push({ start: groupStart, end: i });
        } else {
            i++;
        }
    }

    for (const g of groups) {
        for (let j = g.start; j < g.end; j++) {
            let ev = rows[j].event.trim();
            const numMatch = ev.match(/^(FIA|SIA)\s*(?:-\s*|Subject\s*)(\d+)/i);
            if (numMatch) {
                rows[j].event = `${prefix} Subject ${numMatch[2]}`;
            } else {
                rows[j].event = `${prefix} Exam`;
            }
        }
    }
}

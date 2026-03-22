const MONTH_NUM = {
    JANUARY: '01', FEBRUARY: '02', MARCH: '03', APRIL: '04', MAY: '05', JUNE: '06',
    JULY: '07', AUGUST: '08', SEPTEMBER: '09', OCTOBER: '10', NOVEMBER: '11', DECEMBER: '12'
};

/**
 * Generate a random ID similar to Google Calendar event IDs.
 */
function generateGroupId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 26; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

/**
 * Determine the time range for an event title.
 */
function getFullTime(title) {
    const upper = title.toUpperCase();
    if (upper.startsWith('WORKING DAY') || upper.includes('COMMENCEMENT')) {
        return '08:30 AM - 03:00 PM';
    }
    return '';
}

/**
 * Convert parsed calendar data into a flat array of RTDB-ready event objects.
 * @param {Array} calendar  from parseAllPages()
 * @returns {Array<{date, fullTime, groupId, id, title, type}>}
 */
export function buildRTDBEvents(calendar) {
    const events = [];

    for (const m of calendar) {
        const monthNum = MONTH_NUM[m.month] || '01';
        const yr = m.year || '2026';

        const monthEntries = [];
        let lastDate = '';

        // Single pass: handle both dated rows and sub-entries (empty date = inherits previous)
        for (const r of m.rows) {
            let isoDate = '';

            if (r.date) {
                const dd = String(r.date).padStart(2, '0');
                isoDate = `${yr}-${monthNum}-${dd}`;
                lastDate = isoDate;
            } else if (lastDate) {
                isoDate = lastDate;
            }

            if (!isoDate) continue;

            const eventText = (r.event || '').trim();
            if (!eventText) continue;

            const upper = eventText.toUpperCase();
            const defaultType = (upper.startsWith('WORKING DAY') || upper.includes('COMMENCEMENT')) ? 'Custom' : 'FullDay';

            monthEntries.push({
                isoDate,
                title: eventText,
                fullTime: r.fullTime || getFullTime(eventText),
                type: r.type || defaultType
            });
        }

        monthEntries.sort((a, b) => a.isoDate.localeCompare(b.isoDate));

        // Assign groupIds: consecutive entries with the same title share one
        let currentGroupId = generateGroupId();
        let prevTitle = null;

        for (const entry of monthEntries) {
            if (entry.title !== prevTitle) {
                currentGroupId = generateGroupId();
            }
            prevTitle = entry.title;

            events.push({
                date: entry.isoDate,
                fullTime: entry.fullTime,
                type: entry.type,
                groupId: currentGroupId,
                id: `${currentGroupId}_${entry.isoDate}`,
                title: entry.title
            });
        }
    }

    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
}

/**
 * Download events as a JSON file.
 */
export function downloadRTDBJson(events) {
    const jsonStr = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'academic_calendar_rtdb.json';
    a.click();
    URL.revokeObjectURL(url);
}

export const convertTo12Hour = (t) => {
    if (!t || typeof t !== 'string') return t || "";
    if (!t.includes(":")) return t;
    const [hours, minutes] = t.split(":");
    let h = parseInt(hours, 10);
    if (isNaN(h)) return t;
    const m = minutes || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
};

/**
 * Formats a Date object or ISO string to DD/MM/YYYY.
 */
export const formatDateDDMMYYYY = (date) => {
    if (!date) return "";
    
    if (typeof date === 'string') {
        // If the string is already a formatted ISO date (YYYY-MM-DD) string, let it parse.
        // Otherwise, it's an intermediate typing string like "12/03", so return it as-is.
        const isoFormatRegex = /^\d{4}-\d{2}-\d{2}/;
        if (!isoFormatRegex.test(date) && !date.includes("T")) {
            return date;
        }
    }

    const d = typeof date === 'string' ? new Date(date + (date.includes('T') ? '' : 'T00:00:00')) : date;
    if (isNaN(d.getTime())) return String(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Auto-slashes a DDMMYYYY input string.
 */
export const handleAutoSlash = (value) => {
    let clean = value.replace(/\D/g, '').slice(0, 8);
    let formatted = clean;
    if (clean.length > 2) formatted = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 4) formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
    return formatted;
};

/**
 * Converts formatted DD/MM/YYYY string to YYYY-MM-DD.
 */
export const parseDMYToISO = (dmy) => {
    if (!dmy || dmy.length < 10) return dmy;
    const [d, m, y] = dmy.split('/');
    if (!d || !m || !y) return dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

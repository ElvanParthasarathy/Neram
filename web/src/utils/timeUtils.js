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
    const d = typeof date === 'string' ? new Date(date + (date.includes('T') ? '' : 'T00:00:00')) : date;
    if (isNaN(d.getTime())) return String(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

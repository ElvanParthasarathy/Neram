export const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Return original if parse fails
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
};

export const formatTime = (timeStr) => {
    if (!timeStr) return "";
    // Handle "09:00" -> "09:00 AM" or "14:00" -> "02:00 PM"
    // Also handle already formatted strings or range strings if passed mistakenly
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;

    const [hours, minutes] = timeStr.split(':');
    if (!hours || !minutes) return timeStr;

    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;

    return `${h12}:${minutes} ${ampm}`;
};

// Helper for ranges "09:00 - 12:00" -> "09:00 AM - 12:00 PM"
export const formatTimeRange = (rangeStr) => {
    if (!rangeStr) return "";
    const parts = rangeStr.split('-').map(s => s.trim());
    if (parts.length === 2) {
        return `${formatTime(parts[0])} - ${formatTime(parts[1])}`;
    }
    return formatTime(rangeStr);
};

export const formatDateFull = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RiCalendarLine, RiDownloadLine, RiCloseLine, RiUploadCloud2Line, RiArrowLeftSLine, RiArrowRightSLine, RiDeleteBinLine } from 'react-icons/ri';

function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const convertTo12Hour = (t) => {
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

function parse12HourTo24(time12) {
    if (!time12) return "";
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return "";
    let h = parseInt(match[1], 10);
    const mStr = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${mStr}`;
}

const MONTH_MAP = {
    JANUARY: '01', FEBRUARY: '02', MARCH: '03', APRIL: '04', MAY: '05', JUNE: '06',
    JULY: '07', AUGUST: '08', SEPTEMBER: '09', OCTOBER: '10', NOVEMBER: '11', DECEMBER: '12'
};

const getIsoDate = (year, monthStr, dayNum) => {
    if (!dayNum || dayNum === '-' || dayNum === '') return '';
    const num = parseInt(String(dayNum).replace(/\D/g, ''), 10);
    if (isNaN(num)) return '';
    const mm = MONTH_MAP[(monthStr || '').toUpperCase()] || '01';
    const dd = String(num).padStart(2, '0');
    return `${year || new Date().getFullYear()}-${mm}-${dd}`;
};

const CalendarBuilder = ({
    isOpen, onClose,
    parsedCalendar, batchResults,
    onCellChange, onExport, onPushToFirebase,
    batches = [], selectedBatch = '', onBatchChange, isPushing = false,
    inlineMode = false, hideHeader = false
}) => {
    const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

    useEffect(() => {
        if (parsedCalendar && currentMonthIndex >= parsedCalendar.length) {
            setCurrentMonthIndex(Math.max(0, parsedCalendar.length - 1));
        }
    }, [parsedCalendar, currentMonthIndex]);

    if (!isOpen || !parsedCalendar || parsedCalendar.length === 0) return null;

    const content = (
        <div className={inlineMode ? 'ea-cal-inline' : `ea-cal-backdrop ${isOpen ? 'active' : ''}`}>
            {/* Header */}
            {!hideHeader && (
                <div className="ea-cal-header">
                    <div className="ea-cal-header-left">
                        <RiCalendarLine className="ea-cal-header-icon" />
                        <div>
                            <div className="ea-cal-header-title">Elvan Agazhi</div>
                            <div className="ea-cal-header-sub">Academic Calendar Builder</div>
                        </div>
                    </div>
                    <div className="ea-cal-header-right">
                        {/* Batch Picker */}
                        {batches.length > 0 && (
                            <select
                                value={selectedBatch}
                                onChange={(e) => onBatchChange?.(e.target.value)}
                                style={{
                                    background: 'var(--mac-card-bg)', color: 'var(--mac-text)',
                                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                                    padding: '8px 14px', fontSize: 13, fontWeight: 600
                                }}
                            >
                                {batches.map(b => <option key={b} value={b}>Batch {b}</option>)}
                            </select>
                        )}
                        <button className="ea-cal-btn primary" onClick={onExport}>
                            <RiDownloadLine /> Export JSON
                        </button>
                        {onPushToFirebase && (
                            <button
                                className="ea-cal-btn"
                                onClick={onPushToFirebase}
                                disabled={isPushing}
                                style={{ color: '#30D158', borderColor: 'rgba(48,209,88,0.3)', opacity: isPushing ? 0.5 : 1 }}
                            >
                                <RiUploadCloud2Line /> {isPushing ? 'Pushing...' : 'Push to Firebase'}
                            </button>
                        )}
                        <button className="ea-cal-btn" onClick={onClose}>
                            <RiCloseLine /> Close
                        </button>
                        {/* Add quick inline CSS for inlineMode if missing from main CSS */}
                        {inlineMode && (
                            <style>{`
                            .ea-cal-inline { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; background: transparent; overflow: hidden; border-radius: 0; }
                            .ea-cal-inline .ea-cal-body { padding: 0 20px 20px; }
                            .ea-cal-inline .ea-cal-header { background: transparent; padding: 20px 20px 10px; border-bottom: none; }
                            .ea-cal-inline .ea-cal-image-pane { display: none; } /* Hide image pane entirely in inline mode since there are no images */
                            .ea-cal-inline .ea-cal-table-pane { max-width: 100%; }
                        `}</style>
                        )}
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="ea-cal-body">
                {(() => {
                    const m = parsedCalendar[currentMonthIndex];
                    if (!m) return null;

                    const mi = currentMonthIndex;
                    const workingCount = m.rows.filter(r => r.workingDay).length;
                    const holidayCount = m.rows.filter(r => r.isHoliday).length;
                    const titleCase = m.month.charAt(0) + m.month.slice(1).toLowerCase();
                    const imgSrc = (batchResults && m.sourceIdx !== undefined && batchResults[m.sourceIdx])
                        ? batchResults[m.sourceIdx].imageDataURL : '';

                    return (
                        <div key={mi} className="ea-cal-month-block">
                            <div className="ea-cal-month-header" style={{ flexShrink: 0 }}>
                                <div className="ea-cal-month-name">
                                    <RiCalendarLine />
                                    {titleCase} {m.year}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div className="ea-cal-month-stats">
                                        <span className="ea-working-tag">{workingCount} working</span>
                                        <span className="ea-holiday-tag">{holidayCount} holidays</span>
                                    </div>
                                    <div className="ea-cal-pagination" style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            className="ea-cal-btn" 
                                            disabled={currentMonthIndex === 0}
                                            onClick={() => setCurrentMonthIndex(i => i - 1)}
                                            style={{ padding: '6px 12px', fontSize: 12 }}
                                        >
                                            <RiArrowLeftSLine size={16} /> Prev Month
                                        </button>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mac-text)', padding: '6px' }}>
                                            {currentMonthIndex + 1} / {parsedCalendar.length}
                                        </span>
                                        <button 
                                            className="ea-cal-btn" 
                                            disabled={currentMonthIndex === parsedCalendar.length - 1}
                                            onClick={() => setCurrentMonthIndex(i => i + 1)}
                                            style={{ padding: '6px 12px', fontSize: 12 }}
                                        >
                                            Next Month <RiArrowRightSLine size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="ea-cal-month-content" style={{ flex: 1, minHeight: 0 }}>
                                {/* Image pane */}
                                <div className="ea-cal-image-pane" style={{ position: 'relative', top: 'auto', alignSelf: 'stretch', maxHeight: 'none', height: '100%' }}>
                                    <div className="ea-cal-pane-label">📄 Original Crop</div>
                                    {imgSrc ?
                                        <img src={imgSrc} alt={`Page ${mi + 1} crop`} /> :
                                        <div style={{ color: 'var(--mac-text-secondary)', fontSize: 12 }}>No image</div>
                                    }
                                </div>

                                {/* Table pane */}
                                <div className="ea-cal-table-pane" style={{ height: '100%' }}>
                                    <table className="ea-cal-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Day</th>
                                                <th>WD#</th>
                                                <th>Event Title</th>
                                                <th style={{ width: 140 }}>Time (fullTime)</th>
                                                <th style={{ width: 100 }}>Type</th>
                                                <th style={{ width: 80, textAlign: 'center' }}>Delete</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {m.rows.map((r, ri) => {
                                                {/* Type Detection: WD# -> Event, "Holiday" -> Holiday (handle typos like 'hoilday') */}
                                                let detectedType = r.type;
                                                if (!detectedType) {
                                                    if (r.workingDay) {
                                                        detectedType = 'Event';
                                                    } else if (r.event) {
                                                        const t = r.event.toLowerCase();
                                                        // Default to Holiday for anything not a WD# unless user manually picked Academic
                                                        // Adding 'hoilday' and 'holyday' to catch common OCR typos
                                                        if (t.includes('holiday') || t.includes('hoilday') || t.includes('holyday')) {
                                                            detectedType = 'Holiday';
                                                        } else {
                                                            // User requested: "BY DEFUALT IT SHLOD SELCT THE HOLIDSY FOR THE INSTED OF ACADEMIC"
                                                            detectedType = 'Holiday';
                                                        }
                                                    }
                                                }
                                                const currentType = detectedType || '';
                                                const hasType = !!currentType;

                                                return (
                                                    <tr key={ri} className={r.isHoliday ? 'is-holiday' : ''}>
                                                        <td className="ea-date-col" style={{ opacity: hasType ? 1 : 0.4 }}>
                                                            <input
                                                                type="date"
                                                                lang="en-GB"
                                                                value={getIsoDate(m.year, m.month, r.date)}
                                                                className="ea-type-select"
                                                                style={{ padding: '4px', fontSize: '13px', width: 'auto', border: hasType ? '' : 'none', background: 'transparent' }}
                                                                onChange={(e) => {
                                                                    const iso = e.target.value;
                                                                    if (!iso) {
                                                                        onCellChange(mi, ri, 'date', '');
                                                                        onCellChange(mi, ri, 'day', '');
                                                                        return;
                                                                    }
                                                                    const parts = iso.split('-');
                                                                    if (parts.length === 3) {
                                                                        const dateNum = parseInt(parts[2], 10).toString();
                                                                        onCellChange(mi, ri, 'date', dateNum);
                                                                        
                                                                        const dObj = new Date(iso);
                                                                        const dayNames = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
                                                                        onCellChange(mi, ri, 'day', dayNames[dObj.getDay()]);
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="ea-day-col" style={{ opacity: hasType ? 0.8 : 0.3, letterSpacing: '0.5px' }}>
                                                            {escapeAttr(r.day || '—')}
                                                        </td>
                                                        <td className={`ea-wd-col ${r.workingDay ? '' : 'no-wd'}`}>
                                                            <input
                                                                type="text"
                                                                value={r.workingDay || ''}
                                                                style={{ textAlign: 'center', padding: '8px 2px' }}
                                                                placeholder="—"
                                                                onChange={(e) => onCellChange(mi, ri, 'workingDay', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="ea-event-col">
                                                            <input
                                                                type="text"
                                                                className="ea-event-input"
                                                                value={r.event || ''}
                                                                placeholder="Event Title..."
                                                                onChange={(e) => onCellChange(mi, ri, 'event', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="ea-time-col">
                                                            {!hasType ? (
                                                                <span style={{ fontSize: 12, opacity: 0.1 }}>—</span>
                                                            ) : ((currentType === 'Event' || currentType === 'Academic') ? (() => {
                                                                const rawTime = escapeAttr(r.fullTime || '08:30 AM - 03:00 PM');
                                                                const parts = rawTime.split(' - ');
                                                                const tStart24 = parse12HourTo24(parts[0] || '08:30 AM');
                                                                const tEnd24 = parse12HourTo24(parts[1] || '03:00 PM');
                                                                return (
                                                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                                        <input
                                                                            type="time"
                                                                            className="ea-event-input-time"
                                                                            value={tStart24}
                                                                            onChange={(e) => {
                                                                                const newStart12 = convertTo12Hour(e.target.value);
                                                                                const oldEnd12 = parts[1] || '03:00 PM';
                                                                                onCellChange(mi, ri, 'fullTime', `${newStart12} - ${oldEnd12}`);
                                                                            }}
                                                                        />
                                                                        <span style={{ fontSize: 10, opacity: 0.5 }}>to</span>
                                                                        <input
                                                                            type="time"
                                                                            className="ea-event-input-time"
                                                                            value={tEnd24}
                                                                            onChange={(e) => {
                                                                                const oldStart12 = parts[0] || '08:30 AM';
                                                                                const newEnd12 = convertTo12Hour(e.target.value);
                                                                                onCellChange(mi, ri, 'fullTime', `${oldStart12} - ${newEnd12}`);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            })() : (
                                                                <span style={{ fontSize: 12, opacity: 0.5, padding: '4px 6px' }}>All Day</span>
                                                            ))}
                                                        </td>
                                                        <td className="ea-type-col">
                                                            <select
                                                                className="ea-type-select"
                                                                value={currentType}
                                                                style={{ 
                                                                    opacity: hasType ? 1 : 0.5,
                                                                    color: currentType === 'Holiday' ? '#9C27B0' : currentType === 'Academic' ? '#FFCA28' : currentType === 'Event' ? '#42A5F5' : 'inherit',
                                                                    fontWeight: hasType ? 700 : 500
                                                                }}
                                                                onChange={(e) => {
                                                                    const newType = e.target.value;
                                                                    onCellChange(mi, ri, 'type', newType);
                                                                    if (newType === 'Event' || newType === 'Academic') {
                                                                        if (!r.fullTime || r.fullTime === 'All Day') {
                                                                            onCellChange(mi, ri, 'fullTime', '08:30 AM - 03:00 PM');
                                                                        }
                                                                    } else if (newType === 'Holiday') {
                                                                        onCellChange(mi, ri, 'fullTime', 'All Day');
                                                                    } else {
                                                                        onCellChange(mi, ri, 'fullTime', '');
                                                                    }
                                                                }}
                                                            >
                                                                <option value="">— None —</option>
                                                                <option value="Event">Working Day</option>
                                                                <option value="Holiday">Holiday</option>
                                                                <option value="Academic">Occasion</option>
                                                            </select>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                className="ea-row-delete-btn"
                                                                onClick={() => {
                                                                    if (window.confirm('Clear this event row?')) {
                                                                        onCellChange?.(mi, ri, '_DELETE_ROW', true);
                                                                    }
                                                                }}
                                                                title="Clear Row"
                                                            >
                                                                <RiDeleteBinLine size={14} />
                                                                <span style={{ fontSize: 11, fontWeight: 700 }}>Clear</span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );

    return inlineMode ? content : createPortal(content, document.body);
};

export default CalendarBuilder;

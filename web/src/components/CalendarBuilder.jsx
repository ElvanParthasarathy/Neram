import React from 'react';
import { RiCalendarLine, RiDownloadLine, RiCloseLine, RiUploadCloud2Line } from 'react-icons/ri';

function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const CalendarBuilder = ({
    isOpen, onClose,
    parsedCalendar, batchResults,
    onCellChange, onExport, onPushToFirebase,
    batches = [], selectedBatch = '', onBatchChange, isPushing = false,
    inlineMode = false, hideHeader = false
}) => {
    if (!isOpen) return null;

    return (
        <div className={inlineMode ? 'ea-cal-inline' : `ea-cal-backdrop ${isOpen ? 'active' : ''}`}>
            {/* Header */}
            {!hideHeader && (
                <div className="ea-cal-header">
                    <div className="ea-cal-header-left">
                        <RiCalendarLine className="ea-cal-header-icon" />
                        <div>
                            <div className="ea-cal-header-title">Academic Calendar Builder</div>
                            <div className="ea-cal-header-sub">Edit any cell below. Changes are live.</div>
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
                {parsedCalendar.map((m, mi) => {
                    const workingCount = m.rows.filter(r => r.workingDay).length;
                    const holidayCount = m.rows.filter(r => r.isHoliday).length;
                    const titleCase = m.month.charAt(0) + m.month.slice(1).toLowerCase();
                    const imgSrc = (batchResults && m.sourceIdx !== undefined && batchResults[m.sourceIdx])
                        ? batchResults[m.sourceIdx].imageDataURL : '';

                    return (
                        <div key={mi} className="ea-cal-month-block">
                            <div className="ea-cal-month-header">
                                <div className="ea-cal-month-name">
                                    <RiCalendarLine />
                                    {titleCase} {m.year}
                                </div>
                                <div className="ea-cal-month-stats">
                                    <span className="ea-working-tag">{workingCount} working</span>
                                    <span className="ea-holiday-tag">{holidayCount} holidays</span>
                                </div>
                            </div>

                            <div className="ea-cal-month-content">
                                {/* Image pane */}
                                <div className="ea-cal-image-pane">
                                    <div className="ea-cal-pane-label">📄 Original Crop</div>
                                    {imgSrc ?
                                        <img src={imgSrc} alt={`Page ${mi + 1} crop`} /> :
                                        <div style={{ color: 'var(--mac-text-secondary)', fontSize: 12 }}>No image</div>
                                    }
                                </div>

                                {/* Table pane */}
                                <div className="ea-cal-table-pane">
                                    <table className="ea-cal-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: 50 }}>Date</th>
                                                <th style={{ width: 60 }}>Day</th>
                                                <th style={{ width: 50 }}>WD#</th>
                                                <th>Event Title</th>
                                                <th style={{ width: 140 }}>Time (fullTime)</th>
                                                <th style={{ width: 100 }}>Type</th>
                                                <th style={{ width: 40, textAlign: 'center' }}>⚙️</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {m.rows.map((r, ri) => {
                                                const wdClass = r.workingDay ? '' : 'no-wd';
                                                return (
                                                    <tr key={ri} className={r.isHoliday ? 'is-holiday' : ''}>
                                                        <td className="ea-date-col">
                                                            <input
                                                                type="text"
                                                                defaultValue={escapeAttr(r.date)}
                                                                style={{ width: 40, textAlign: 'center' }}
                                                                onChange={(e) => onCellChange(mi, ri, 'date', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="ea-day-col">
                                                            <input
                                                                type="text"
                                                                defaultValue={escapeAttr(r.day)}
                                                                style={{ width: 50 }}
                                                                onChange={(e) => onCellChange(mi, ri, 'day', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className={`ea-wd-col ${wdClass}`}>
                                                            <input
                                                                type="text"
                                                                defaultValue={escapeAttr(r.workingDay || '')}
                                                                style={{ width: 40, textAlign: 'center' }}
                                                                placeholder="—"
                                                                onChange={(e) => onCellChange(mi, ri, 'workingDay', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="ea-event-col">
                                                            <input
                                                                type="text"
                                                                className="ea-event-input"
                                                                defaultValue={escapeAttr(r.event)}
                                                                placeholder="Event Title..."
                                                                onChange={(e) => onCellChange(mi, ri, 'event', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="ea-time-col">
                                                            <input
                                                                type="text"
                                                                className="ea-event-input"
                                                                defaultValue={escapeAttr(r.fullTime || '')}
                                                                placeholder="All Day"
                                                                style={{ fontSize: 12, opacity: 0.8 }}
                                                                onChange={(e) => onCellChange(mi, ri, 'fullTime', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="ea-type-col">
                                                            <select
                                                                defaultValue={r.type || 'FullDay'}
                                                                style={{ background: 'transparent', color: 'inherit', border: 'none', outline: 'none', width: '100%', fontSize: 12, cursor: 'pointer' }}
                                                                onChange={(e) => onCellChange(mi, ri, 'type', e.target.value)}
                                                            >
                                                                <option value="" style={{ color: '#000' }}>None</option>
                                                                <option value="FullDay" style={{ color: '#000' }}>FullDay</option>
                                                                <option value="HalfDay" style={{ color: '#000' }}>HalfDay</option>
                                                                <option value="Holiday" style={{ color: '#000' }}>Holiday</option>
                                                            </select>
                                                        </td>
                                                        <td style={{ textAlign: 'center' }}>
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm('Delete this event row?')) {
                                                                        onCellChange?.(mi, ri, '_DELETE_ROW', true);
                                                                    }
                                                                }}
                                                                style={{ background: 'transparent', color: '#ff453a', border: 'none', cursor: 'pointer', padding: 4 }}
                                                                title="Delete Row"
                                                            >
                                                                <RiCloseLine size={16} />
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
                })}
            </div>
        </div>
    );
};

export default CalendarBuilder;

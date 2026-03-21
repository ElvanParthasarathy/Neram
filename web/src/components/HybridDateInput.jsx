import React, { useState, useEffect } from 'react';
import { RiCalendarLine } from 'react-icons/ri';
import { formatDateDDMMYYYY, handleAutoSlash, parseDMYToISO } from '../utils/timeUtils';

/**
 * HybridDateInput
 * - Mobile: shows a visible native date input (dd/mm/yyyy via Indian locale)
 * - Desktop: shows a typable text input with auto-slash + calendar icon trigger
 *
 * Props:
 *   value       – ISO string (YYYY-MM-DD) or empty
 *   onChange     – callback(isoString)
 *   placeholder  – optional, defaults to "dd/mm/yyyy"
 *   className    – optional extra class on the wrapper
 *   inputClass   – optional extra class on the input element
 *   style        – optional inline style on wrapper
 */
const HybridDateInput = ({ value, onChange, placeholder = 'dd/mm/yyyy', className = '', inputClass = '', style }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    // Mobile: native date input only, visible and styled
    return (
      <div className={`hybrid-date-field ${className}`} style={style}>
        <input
          type="date"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className={`native-date-input ${inputClass}`}
          lang="en-IN"
        />
      </div>
    );
  }

  // Desktop: typable text input + calendar icon + hidden native picker
  return (
    <div className={`hybrid-date-field ${className}`} style={style}>
      <input
        type="text"
        placeholder={placeholder}
        value={formatDateDDMMYYYY(value)}
        onChange={(e) => {
          const formatted = handleAutoSlash(e.target.value);
          onChange(parseDMYToISO(formatted));
        }}
        className={`custom-datepicker-input ${inputClass}`}
      />
      <RiCalendarLine
        className="calendar-icon"
        onClick={(e) => e.target.parentElement.querySelector('.hidden-native-picker')?.showPicker?.()}
      />
      <input
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="hidden-native-picker"
      />
    </div>
  );
};

export default HybridDateInput;

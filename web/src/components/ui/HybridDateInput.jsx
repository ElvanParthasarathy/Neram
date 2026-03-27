import React, { useRef, useState, useEffect } from 'react';
import { RiCalendarLine } from 'react-icons/ri';
import { formatDateDDMMYYYY, handleAutoSlash, parseDMYToISO } from '../../utils/timeUtils';

/**
 * HybridDateInput
 * Always shows a text input with dd/mm/yyyy format + calendar icon.
 * Tapping the calendar icon (or the field on mobile) opens the native picker.
 * This ensures dd/mm/yyyy is shown regardless of device locale.
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
  const hiddenRef = useRef(null);
  const [localText, setLocalText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Sync localText when value changes externally (and field is not focused)
  useEffect(() => {
    if (!isFocused) {
      setLocalText(formatDateDDMMYYYY(value));
    }
  }, [value, isFocused]);

  const openNativePicker = () => {
    if (hiddenRef.current) {
      // showPicker() is supported in modern browsers
      if (hiddenRef.current.showPicker) {
        try { hiddenRef.current.showPicker(); } catch {}
      } else {
        hiddenRef.current.click();
      }
    }
  };

  const handleTextChange = (e) => {
    const formatted = handleAutoSlash(e.target.value);
    setLocalText(formatted);
    // Only call onChange when we have a complete date
    const iso = parseDMYToISO(formatted);
    if (iso && iso.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      onChange(iso);
    } else if (formatted === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Re-sync display from the canonical value
    setLocalText(formatDateDDMMYYYY(value));
  };

  return (
    <div className={`hybrid-date-field ${className}`} style={style}>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={isFocused ? localText : formatDateDDMMYYYY(value)}
        onFocus={() => { setIsFocused(true); setLocalText(formatDateDDMMYYYY(value)); }}
        onBlur={handleBlur}
        onChange={handleTextChange}
        className={`custom-datepicker-input ${inputClass}`}
      />
      <RiCalendarLine
        className="calendar-icon"
        onClick={openNativePicker}
      />
      <input
        ref={hiddenRef}
        type="date"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="hidden-native-picker"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
};

export default HybridDateInput;

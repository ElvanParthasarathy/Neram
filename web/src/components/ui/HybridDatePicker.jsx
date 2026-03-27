import React, { useState, useEffect } from 'react';
import { RiCalendarCheckLine } from 'react-icons/ri';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * HybridDatePicker
 * Displays the native Android MDC DatePicker if `window.NativeBridge` exists.
 * Falls back to `react-datepicker` for PWA and Desktop browsers.
 */
const HybridDatePicker = ({ 
  selected, 
  onChange, 
  placeholderText = "Select Date", 
  minDate,
  maxDate,
  className = "event-input", 
  style = {} 
}) => {
  const isHybrid = window.NativeBridge && typeof window.NativeBridge.showDatePicker === 'function';

  // State to hold unique callback function name
  const [callbackName, setCallbackName] = useState('');

  useEffect(() => {
    if (isHybrid) {
      const uniqueId = `datePickerCallback_${Math.random().toString(36).substr(2, 9)}`;
      setCallbackName(uniqueId);

      window[uniqueId] = (timestampMs) => {
        if (onChange) {
            if (!timestampMs) {
               // user cancelled or cleared
               onChange(null);
            } else {
               // Must create a local JS Date object from the Unix Milliseconds
               const jsDate = new Date(timestampMs);
               onChange(jsDate);
            }
        }
      };

      return () => {
        delete window[uniqueId];
      };
    }
  }, [isHybrid, onChange]);

  const handleNativeClick = () => {
    if (isHybrid && callbackName) {
      const currentMs = selected ? selected.getTime() : 0;
      window.NativeBridge.showDatePicker(currentMs, callbackName);
    }
  };

  if (isHybrid) {
    // Native Mobile Behavior (Custom Pill trigger)
    return (
      <div 
        className={className} 
        style={{ ...style, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={handleNativeClick}
      >
        <span style={{ color: selected ? 'inherit' : 'var(--mac-text-secondary)', fontSize: 'inherit' }}>
          {selected ? selected.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : placeholderText}
        </span>
        <RiCalendarCheckLine style={{ color: 'var(--mac-text-secondary)', fontSize: '18px' }} />
      </div>
    );
  }

  // Desktop / PWA Fallback
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      className={className}
      placeholderText={placeholderText}
      minDate={minDate}
      maxDate={maxDate}
      dateFormat="dd MMM yyyy"
      isClearable={false}
      style={{ ...style, cursor: 'pointer' }}
    />
  );
};

export default HybridDatePicker;

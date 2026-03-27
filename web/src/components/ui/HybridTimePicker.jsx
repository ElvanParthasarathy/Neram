import React, { useState, useEffect } from 'react';
import { RiTimeLine } from 'react-icons/ri';

/**
 * HybridTimePicker
 * Displays the native Android MDC TimePicker if `window.NativeBridge` exists.
 * Falls back to standard `<input type="time">` for PWA and Desktop browsers.
 */
const HybridTimePicker = ({ 
  value, // "HH:MM" (e.g. "09:00" or "14:30") 
  onChange, 
  className = "event-input", 
  style = {} 
}) => {
  const isHybrid = window.NativeBridge && typeof window.NativeBridge.showTimePicker === 'function';
  const [callbackName, setCallbackName] = useState('');

  useEffect(() => {
    if (isHybrid) {
      const uniqueId = `timePickerCallback_${Math.random().toString(36).substr(2, 9)}`;
      setCallbackName(uniqueId);

      window[uniqueId] = (hour, minute) => {
        if (onChange) {
            if (hour === -1 && minute === -1) {
                // user cancelled without picking
                return;
            }
            // Format to "HH:MM" padding with zero if single digit
            const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            onChange(formattedTime);
        }
      };

      return () => {
        delete window[uniqueId];
      };
    }
  }, [isHybrid, onChange]);

  const handleNativeClick = () => {
    if (isHybrid && callbackName) {
      let currentH = -1;
      let currentM = -1;
      
      if (value) {
          const parts = value.split(":");
          if (parts.length >= 2) {
              currentH = parseInt(parts[0], 10) || -1;
              currentM = parseInt(parts[1], 10) || -1;
          }
      }

      window.NativeBridge.showTimePicker(currentH, currentM, callbackName);
    }
  };

  // Helper to format 24h string to 12h for UI display
  const formatUITime = (timeStr) => {
    if (!timeStr) return "Select Time";
    const [h, m] = timeStr.split(':');
    let hInt = parseInt(h, 10);
    const mStr = m ? m : '00';
    if (isNaN(hInt)) return "Select Time";
    const ampm = hInt >= 12 ? 'PM' : 'AM';
    hInt = hInt % 12;
    hInt = hInt ? hInt : 12; // 0 format to 12
    return `${hInt.toString().padStart(2, '0')}:${mStr} ${ampm}`;
  };

  if (isHybrid) {
    // Native Mobile Behavior (Custom Pill trigger)
    return (
      <div 
        className={className} 
        style={{ ...style, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={handleNativeClick}
      >
        <span style={{ color: value ? 'inherit' : 'var(--mac-text-secondary)', fontSize: 'inherit' }}>
          {formatUITime(value)}
        </span>
        <RiTimeLine style={{ color: 'var(--mac-text-secondary)', fontSize: '18px' }} />
      </div>
    );
  }

  // Desktop / PWA Fallback
  return (
    <input 
      type="time" 
      value={value || ''} 
      onChange={(e) => onChange(e.target.value)} 
      className={className} 
      style={{ ...style, cursor: 'pointer' }}
    />
  );
};

export default HybridTimePicker;

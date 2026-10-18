import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function toIsoDateTime(str) {
  if (!str) return '';
  str = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) return str.slice(0, 16);

  // Parse '24 May 2025, 14:00' or '24 May 2025 14:00'
  const m = str.match(/(\d{1,2})\s+([A-Za-z]{3,9})[\s,]+(\d{4})(?:[\s,]+(\d{1,2}):(\d{2}))?/i);
  if (m) {
    const day = String(m[1]).padStart(2, '0');
    const mon = String(MONTHS[m[2].slice(0, 3).toLowerCase()] || 1).padStart(2, '0');
    const yr = m[3];
    const hr = String(m[4] || '12').padStart(2, '0');
    const min = String(m[5] || '00').padStart(2, '0');
    return `${yr}-${mon}-${day}T${hr}:${min}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return '';
}

export function toIsoDate(str) {
  if (!str) return '';
  str = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);

  const m = str.match(/(\d{1,2})\s+([A-Za-z]{3,9})[\s,]+(\d{4})/i);
  if (m) {
    const day = String(m[1]).padStart(2, '0');
    const mon = String(MONTHS[m[2].slice(0, 3).toLowerCase()] || 1).padStart(2, '0');
    const yr = m[3];
    return `${yr}-${mon}-${day}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return '';
}

export function toIsoTime(str) {
  if (!str) return '';
  str = String(str).trim();
  const m = str.match(/(\d{1,2}):(\d{2})/);
  if (m) {
    return `${String(m[1]).padStart(2, '0')}:${String(m[2]).padStart(2, '0')}`;
  }
  return '';
}

export function formatFromIso(isoStr, mode) {
  if (!isoStr) return '';
  if (mode === 'time') return isoStr.slice(0, 5);

  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const pad = (n) => String(n).padStart(2, '0');
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());

  if (mode === 'date') {
    return `${day} ${month} ${year}`;
  }
  return `${day} ${month} ${year}, ${hours}:${mins}`;
}

/**
 * Universal Underline Date & Time Picker Component
 * Supports 'datetime' (Date & Time), 'date' (Date only), and 'time' (Time only).
 * Includes both direct typing and native visual picker popup.
 */
export default function DateTimePickerUnderline({
  value,
  onChange,
  mode = 'datetime', // 'datetime' | 'date' | 'time'
  placeholder = 'Select date & time',
  hasWarning = false,
  alignRight = false,
}) {
  const hiddenInputRef = useRef(null);

  let currentIso = '';
  if (mode === 'datetime') currentIso = toIsoDateTime(value);
  else if (mode === 'date') currentIso = toIsoDate(value);
  else if (mode === 'time') currentIso = toIsoTime(value);

  const handleOpenPicker = () => {
    if (Platform.OS === 'web' && hiddenInputRef.current) {
      if (typeof hiddenInputRef.current.showPicker === 'function') {
        hiddenInputRef.current.showPicker();
      } else {
        hiddenInputRef.current.focus();
        hiddenInputRef.current.click();
      }
    }
  };

  const handleNativeHtmlChange = (e) => {
    const raw = e.target.value;
    if (!raw) {
      onChange('');
      return;
    }
    const readable = formatFromIso(raw, mode);
    onChange(readable);
  };

  const iconEmoji = mode === 'date' ? '📅' : mode === 'time' ? '🕒' : '🗓️';

  return (
    <View style={styles.fieldWrapper}>
      <View
        style={[
          styles.underlineRow,
          hasWarning && styles.underlineWarning,
          alignRight && styles.justifyEnd,
        ]}
      >
        <TextInput
          style={[styles.input, alignRight && styles.textRight]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#C4BCB3"
        />

        {/* Interactive Calendar/Clock Picker Button */}
        <TouchableOpacity
          onPress={handleOpenPicker}
          activeOpacity={0.7}
          style={styles.pickerTriggerBtn}
        >
          <Text style={styles.triggerEmoji}>{iconEmoji}</Text>
          <Text style={styles.triggerLabel}>Pick</Text>
        </TouchableOpacity>
      </View>

      {/* Hidden HTML5 Picker Element (triggers native calendar / clock) */}
      {Platform.OS === 'web' && (
        <input
          ref={hiddenInputRef}
          type={mode === 'datetime' ? 'datetime-local' : mode}
          value={currentIso}
          onChange={handleNativeHtmlChange}
          tabIndex={-1}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            opacity: 0,
            width: 1,
            height: 1,
            pointerEvents: 'none',
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrapper: {
    position: 'relative',
    width: '100%',
  },
  underlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#C4BCB3',
    backgroundColor: 'transparent',
    paddingVertical: 3,
    gap: 6,
  },
  underlineWarning: {
    borderBottomColor: '#D97706',
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1B18',
    paddingVertical: 2,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  textRight: {
    textAlign: 'right',
  },
  pickerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DFD8CE',
    cursor: 'pointer',
  },
  triggerEmoji: {
    fontSize: 11,
  },
  triggerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A7E72',
    letterSpacing: 0.3,
  },
});

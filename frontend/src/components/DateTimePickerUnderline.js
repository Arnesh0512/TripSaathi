import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_MAP = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const QUICK_TIME_PRESETS = [
  { label: '06:00', h: 6, m: 0 },
  { label: '09:00', h: 9, m: 0 },
  { label: '11:30', h: 11, m: 30 },
  { label: '14:00', h: 14, m: 0 },
  { label: '16:30', h: 16, m: 30 },
  { label: '19:00', h: 19, m: 0 },
  { label: '21:30', h: 21, m: 30 },
  { label: '23:00', h: 23, m: 0 },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

/**
 * Parses existing human-readable or ISO strings to { year, monthIndex, day, hour, minute }
 */
function parseInitialState(val, mode) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();
  let hour = 12;
  let minute = 0;

  if (!val || typeof val !== 'string') {
    return { year, month, day, hour, minute };
  }

  const str = val.trim();

  // Try parsing '24 May 2025, 14:00' or '24 May 2025'
  const dateMatch = str.match(/(\d{1,2})\s+([A-Za-z]{3,9})(?:[\s,]+(\d{4}))?(?:[\s,]+(\d{1,2}):(\d{2}))?/i);
  if (dateMatch) {
    day = parseInt(dateMatch[1], 10);
    const mStr = dateMatch[2].slice(0, 3).toLowerCase();
    if (MONTH_MAP[mStr] !== undefined) {
      month = MONTH_MAP[mStr];
    }
    if (dateMatch[3]) {
      year = parseInt(dateMatch[3], 10);
    }
    if (dateMatch[4] !== undefined && dateMatch[5] !== undefined) {
      hour = parseInt(dateMatch[4], 10);
      minute = parseInt(dateMatch[5], 10);
    }
    return { year, month, day, hour, minute };
  }

  // Try parsing ISO '2025-05-24T14:00'
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1;
    day = parseInt(isoMatch[3], 10);
    if (isoMatch[4] !== undefined) {
      hour = parseInt(isoMatch[4], 10);
      minute = parseInt(isoMatch[5], 10);
    }
    return { year, month, day, hour, minute };
  }

  // Try parsing time only '14:30'
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    hour = parseInt(timeMatch[1], 10);
    minute = parseInt(timeMatch[2], 10);
    return { year, month, day, hour, minute };
  }

  return { year, month, day, hour, minute };
}

export default function DateTimePickerUnderline({
  value,
  onChange,
  mode = 'datetime', // 'datetime' | 'date' | 'time'
  placeholder = 'Select date & time',
  hasWarning = false,
  alignRight = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const init = parseInitialState(value, mode);
  const [viewYear, setViewYear] = useState(init.year);
  const [viewMonth, setViewMonth] = useState(init.month);
  const [pickedDay, setPickedDay] = useState(init.day);
  const [pickedHour, setPickedHour] = useState(init.hour);
  const [pickedMinute, setPickedMinute] = useState(init.minute);

  // Sync internal state when external value changes
  useEffect(() => {
    const updated = parseInitialState(value, mode);
    setViewYear(updated.year);
    setViewMonth(updated.month);
    setPickedDay(updated.day);
    setPickedHour(updated.hour);
    setPickedMinute(updated.minute);
  }, [value, mode]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleHourStep = (delta) => {
    let next = (pickedHour + delta) % 24;
    if (next < 0) next = 23;
    setPickedHour(next);
  };

  const handleMinuteStep = (delta) => {
    let next = (pickedMinute + delta) % 60;
    if (next < 0) next = 55;
    setPickedMinute(next);
  };

  const handleConfirm = () => {
    let formatted = '';
    const mName = MONTH_SHORT[viewMonth];

    if (mode === 'datetime') {
      formatted = `${pickedDay} ${mName} ${viewYear}, ${pad(pickedHour)}:${pad(pickedMinute)}`;
    } else if (mode === 'date') {
      formatted = `${pickedDay} ${mName} ${viewYear}`;
    } else if (mode === 'time') {
      formatted = `${pad(pickedHour)}:${pad(pickedMinute)}`;
    }

    onChange(formatted);
    setModalVisible(false);
  };

  const handleClear = () => {
    onChange('');
    setModalVisible(false);
  };

  // Build Calendar Days Matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday

  const calendarDays = [];
  // Leading empty slots
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push({ key: `empty-${i}`, day: null });
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({ key: `day-${d}`, day: d });
  }

  const iconEmoji = mode === 'date' ? '📅' : mode === 'time' ? '🕒' : '🗓️';

  return (
    <View style={styles.container}>
      {/* PURE PICKER UNDERLINE BUTTON (NO MANUAL TYPING TEXTINPUT) */}
      <TouchableOpacity
        style={[
          styles.underlineRow,
          hasWarning && styles.underlineWarning,
          alignRight && styles.justifyEnd,
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.75}
      >
        <Text style={styles.icon}>{iconEmoji}</Text>
        <Text
          style={[
            styles.valueText,
            !value && styles.placeholderText,
            alignRight && styles.textRight,
          ]}
          numberOfLines={1}
        >
          {value ? value : placeholder}
        </Text>
        <View style={styles.selectPill}>
          <Text style={styles.selectPillText}>Select ▾</Text>
        </View>
      </TouchableOpacity>

      {/* INTERACTIVE DATE & TIME PICKER MODAL */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {mode === 'date'
                    ? 'Select Date'
                    : mode === 'time'
                    ? 'Select Time'
                    : 'Select Date & Time'}
                </Text>
                <Text style={styles.modalPreview}>
                  {mode === 'time'
                    ? `${pad(pickedHour)}:${pad(pickedMinute)}`
                    : mode === 'date'
                    ? `${pickedDay} ${MONTH_NAMES[viewMonth]} ${viewYear}`
                    : `${pickedDay} ${MONTH_SHORT[viewMonth]} ${viewYear} • ${pad(pickedHour)}:${pad(pickedMinute)}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* CALENDAR SECTION (for datetime and date modes) */}
              {(mode === 'datetime' || mode === 'date') && (
                <View style={styles.calendarSection}>
                  {/* Month Navigation */}
                  <View style={styles.monthNavRow}>
                    <TouchableOpacity
                      onPress={handlePrevMonth}
                      style={styles.monthNavBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.monthNavBtnText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </Text>
                    <TouchableOpacity
                      onPress={handleNextMonth}
                      style={styles.monthNavBtn}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.monthNavBtnText}>›</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Day of Week Row */}
                  <View style={styles.weekHeaderRow}>
                    {DAY_LABELS.map((lbl, idx) => (
                      <Text key={idx} style={styles.weekHeaderCell}>
                        {lbl}
                      </Text>
                    ))}
                  </View>

                  {/* Days Grid */}
                  <View style={styles.daysGrid}>
                    {calendarDays.map((item) => {
                      if (!item.day) {
                        return <View key={item.key} style={styles.emptyDayCell} />;
                      }
                      const isSelected = item.day === pickedDay;
                      return (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.dayCell,
                            isSelected && styles.dayCellSelected,
                          ]}
                          onPress={() => setPickedDay(item.day)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dayCellText,
                              isSelected && styles.dayCellTextSelected,
                            ]}
                          >
                            {item.day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* TIME SECTION (for datetime and time modes) */}
              {(mode === 'datetime' || mode === 'time') && (
                <View style={styles.timeSection}>
                  <Text style={styles.sectionKicker}>
                    {mode === 'datetime' ? 'SET TIME (24-HOUR)' : 'TIME SELECTION'}
                  </Text>

                  {/* Digital Clock Stepper */}
                  <View style={styles.clockStepperRow}>
                    {/* Hour Stepper */}
                    <View style={styles.stepperCol}>
                      <Text style={styles.stepperSub}>HOURS</Text>
                      <View style={styles.stepperControls}>
                        <TouchableOpacity
                          onPress={() => handleHourStep(-1)}
                          style={styles.stepBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.clockDigit}>{pad(pickedHour)}</Text>
                        <TouchableOpacity
                          onPress={() => handleHourStep(1)}
                          style={styles.stepBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.clockColon}>:</Text>

                    {/* Minute Stepper */}
                    <View style={styles.stepperCol}>
                      <Text style={styles.stepperSub}>MINUTES</Text>
                      <View style={styles.stepperControls}>
                        <TouchableOpacity
                          onPress={() => handleMinuteStep(-5)}
                          style={styles.stepBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.clockDigit}>{pad(pickedMinute)}</Text>
                        <TouchableOpacity
                          onPress={() => handleMinuteStep(5)}
                          style={styles.stepBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Quick Time Presets */}
                  <Text style={[styles.stepperSub, { marginTop: 10, marginBottom: 6 }]}>
                    QUICK PRESETS
                  </Text>
                  <View style={styles.presetsGrid}>
                    {QUICK_TIME_PRESETS.map((p) => {
                      const isMatch = pickedHour === p.h && pickedMinute === p.m;
                      return (
                        <TouchableOpacity
                          key={p.label}
                          style={[
                            styles.presetPill,
                            isMatch && styles.presetPillActive,
                          ]}
                          onPress={() => {
                            setPickedHour(p.h);
                            setPickedMinute(p.m);
                          }}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.presetPillText,
                              isMatch && styles.presetPillTextActive,
                            ]}
                          >
                            {p.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleClear}
                style={styles.clearBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>

              <View style={styles.footerRightButtons}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  style={styles.confirmBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>Confirm & Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  underlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#C4BCB3',
    backgroundColor: 'transparent',
    paddingVertical: 6,
    gap: 6,
    cursor: 'pointer',
  },
  underlineWarning: {
    borderBottomColor: '#D97706',
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },
  icon: {
    fontSize: 13,
  },
  valueText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E1B18',
  },
  placeholderText: {
    color: '#C4BCB3',
    fontWeight: '500',
  },
  textRight: {
    textAlign: 'right',
  },
  selectPill: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#DFD8CE',
  },
  selectPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A7E72',
    letterSpacing: 0.3,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FBF9F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E0D5',
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7DE',
    backgroundColor: '#F5F1E9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1B18',
    letterSpacing: 0.2,
  },
  modalPreview: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C85A32',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#8A7E72',
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Calendar Styles
  calendarSection: {
    marginBottom: 10,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthNavBtn: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EDE8DF',
  },
  monthNavBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E1B18',
  },
  monthTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B18',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekHeaderCell: {
    width: 38,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#8A7E72',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyDayCell: {
    width: 38,
    height: 34,
  },
  dayCell: {
    width: 38,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  dayCellSelected: {
    backgroundColor: '#C85A32',
  },
  dayCellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E1B18',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Time Styles
  timeSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ECE7DE',
  },
  sectionKicker: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A7E72',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  clockStepperRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    backgroundColor: '#F3EFEA',
    borderRadius: 8,
  },
  stepperCol: {
    alignItems: 'center',
  },
  stepperSub: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A7E72',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFD8CE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1B18',
  },
  clockDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B18',
    minWidth: 32,
    textAlign: 'center',
  },
  clockColon: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8A7E72',
    marginTop: 14,
  },

  // Quick Presets
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  presetPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#EDE8DF',
    borderWidth: 1,
    borderColor: '#DFD8CE',
  },
  presetPillActive: {
    backgroundColor: '#C85A32',
    borderColor: '#C85A32',
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#524B43',
  },
  presetPillTextActive: {
    color: '#FFFFFF',
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECE7DE',
    backgroundColor: '#F5F1E9',
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A7E72',
  },
  footerRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#EDE8DF',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#524B43',
  },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#C85A32',
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

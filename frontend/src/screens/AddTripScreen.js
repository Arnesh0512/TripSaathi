import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { styles } from '../styles/appStyles';
import { THEME } from '../constants/theme';
import { tripApi } from '../services/api';
import DateTimePickerUnderline from '../components/DateTimePickerUnderline';

const TICKET_CATEGORIES = [
  { id: 'flight', label: 'Flight', icon: '✈️' },
  { id: 'railway', label: 'Train', icon: '🚆' },
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'cab', label: 'Cab', icon: '🚕' },
  { id: 'bus', label: 'Bus', icon: '🚌' },
];

const TRANSPORT_MODES = [
  { id: 'cab', label: 'Cab', icon: '🚕', color: '#D97706' },
  { id: 'airplane', label: 'Flight', icon: '✈️', color: '#0284C7' },
  { id: 'train', label: 'Train', icon: '🚆', color: '#059669' },
  { id: 'bus', label: 'Bus', icon: '🚌', color: '#7C3AED' },
];

const formatTransitNodeTime = (dtStr) => {
  if (!dtStr) return '--:--';
  const m = dtStr.match(/^(\d{1,2}\s+[A-Za-z]{3})(?:\s+\d{4})?,?\s*(\d{1,2}:\d{2})/);
  if (m) {
    return `${m[1]}, ${m[2]}`;
  }
  return dtStr;
};

export default function AddTripScreen({ token, onAddTripSuccess }) {
  // Option 1 vs Option 2 Mode
  const [activeMode, setActiveMode] = useState('UPLOAD_TICKETS'); // 'UPLOAD_TICKETS' | 'PLAN_TRIP'
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const ph = (text) => (showPlaceholders ? text : '');

  // ----------------------------------------------------
  // Option 1 State: Upload / Add Existing Booked Tickets
  // ----------------------------------------------------
  const [existingTripName, setExistingTripName] = useState('');
  const [tickets, setTickets] = useState([
    {
      id: 1,
      category: 'flight',
      entryMode: 'manual', // 'manual' | 'attachment'
      provider: '',
      ticketNumber: '',
      fromLocation: '',
      toLocation: '',
      departureTime: '',
      arrivalTime: '',
      seatOrRoom: '',
      documentName: '',
      notes: '',
      isScanning: false,
      scanError: null,
      scanNotice: null,
      missingFields: [],
    },
  ]);

  const handleAddTicket = () => {
    const nextId = tickets.length + 1;
    setTickets([
      ...tickets,
      {
        id: nextId,
        category: 'hotel',
        entryMode: 'manual',
        provider: '',
        ticketNumber: '',
        fromLocation: '',
        toLocation: '',
        departureTime: '',
        arrivalTime: '',
        seatOrRoom: '',
        documentName: '',
        notes: '',
        isScanning: false,
        scanError: null,
        scanNotice: null,
        missingFields: [],
      },
    ]);
  };

  const handleUpdateTicket = (id, field, value) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        // If user fills in a missing field, automatically remove the warning mark
        if (typeof value === 'string' && value.trim().length > 0 && t.missingFields?.includes(field)) {
          updated.missingFields = t.missingFields.filter((f) => f !== field);
        }
        return updated;
      })
    );
  };

  const handleRemoveTicket = (id) => {
    if (tickets.length <= 1) return;
    setTickets(tickets.filter((t) => t.id !== id));
  };

  // PDF Ticket Upload & AI Extraction Handler
  const handlePickPdf = (ticketId) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,application/pdf';
      input.onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        await uploadAndScanPdf(ticketId, file);
      };
      input.click();
    } else {
      showAlert('Notice', 'PDF attachment scanning is optimized for web browser.');
    }
  };

  const uploadAndScanPdf = async (ticketId, file) => {
    handleUpdateTicket(ticketId, 'isScanning', true);
    handleUpdateTicket(ticketId, 'scanError', null);
    handleUpdateTicket(ticketId, 'scanNotice', null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await tripApi.parseTicketPdf(formData, token);
      const result = await res.json();

      if (res.ok && (result.status === 'SUCCESS' || result.status === 'PARTIAL')) {
        const data = result.ticket_data || {};
        const backendMissing = result.missing_fields || [];

        // Map backend snake_case keys to camelCase ticket state
        const fieldMap = {
          provider: 'provider',
          ticket_number: 'ticketNumber',
          from_location: 'fromLocation',
          to_location: 'toLocation',
          departure_time: 'departureTime',
          arrival_time: 'arrivalTime',
          seat_or_room: 'seatOrRoom',
        };
        const missingKeys = backendMissing.map((f) => fieldMap[f] || f);

        setTickets((prev) =>
          prev.map((t) => {
            if (t.id !== ticketId) return t;
            return {
              ...t,
              category: data.category || t.category,
              provider: data.provider || t.provider || '',
              ticketNumber: data.ticket_number || t.ticketNumber || '',
              fromLocation: data.from_location || t.fromLocation || '',
              toLocation: data.to_location || t.toLocation || '',
              departureTime: data.departure_time || t.departureTime || '',
              arrivalTime: data.arrival_time || t.arrivalTime || '',
              seatOrRoom: data.seat_or_room || t.seatOrRoom || '',
              notes: data.notes || t.notes || '',
              documentName: result.document_name || file.name,
              missingFields: missingKeys,
              entryMode: 'manual', // Switch to manual section as requested
              isScanning: false,
              scanNotice: missingKeys.length > 0
                ? `Auto-filled via AI (${result.model_used || 'gpt-5-nano'}). Please review missing fields marked with ⚠️.`
                : `All ticket details auto-filled via AI (${result.model_used || 'gpt-5-nano'})!`,
            };
          })
        );
      } else {
        handleUpdateTicket(ticketId, 'isScanning', false);
        handleUpdateTicket(ticketId, 'scanError', result.detail || 'Could not parse ticket PDF');
      }
    } catch (err) {
      handleUpdateTicket(ticketId, 'isScanning', false);
      handleUpdateTicket(ticketId, 'scanError', 'Upload failed: ' + err.message);
    }
  };

  const handleSubmitExistingTrip = async () => {
    if (!existingTripName.trim()) {
      showAlert('Notice', 'Please provide a trip reference name.');
      return;
    }
    setSaving(true);
    setSuccessMessage(null);
    try {
      const payload = {
        trip_name: existingTripName.trim(),
        tickets: tickets.map((t) => ({
          category: t.category,
          provider: t.provider,
          ticket_number: t.ticketNumber,
          from_location: t.fromLocation,
          to_location: t.toLocation,
          departure_time: t.departureTime,
          arrival_time: t.arrivalTime,
          seat_or_room: t.seatOrRoom,
          document_name: t.documentName,
          notes: t.notes,
        })),
        notes: `${tickets.length} booked ticket(s) registered for live monitoring`,
      };

      const res = await tripApi.createExistingTrip(payload, token);
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`✅ Registered ${tickets.length} ticket(s) in TripSaathi database for live disruption monitoring!`);
        setTimeout(() => {
          if (onAddTripSuccess) onAddTripSuccess();
        }, 1800);
      } else {
        showAlert('Error', data.detail || 'Could not save tickets');
      }
    } catch (e) {
      showAlert('Error', 'Network error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // Option 2 State: Plan Multi-Leg Chronological Trip
  // ----------------------------------------------------
  const [plannedTripName, setPlannedTripName] = useState('');
  const [planStartDate, setPlanStartDate] = useState('');
  const [planPeopleCount, setPlanPeopleCount] = useState('');

  const [legs, setLegs] = useState([
    {
      id: 1,
      fromPoint: '',
      toPoint: '',
      mode: 'cab',
      departureTime: '',
      arrivalTime: '',
      estimatedBudget: '',
      preferredServiceUrl: '',
      notes: '',
    },
  ]);

  const [stayPlan, setStayPlan] = useState({
    cityOrHotel: '',
    daysCount: '',
    peopleCount: '',
    hotelBudget: '',
    checkinDate: '',
    checkoutDate: '',
    preferredServiceUrl: '',
  });

  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const prevTo = lastLeg ? lastLeg.toPoint : '';
    const nextId = legs.length + 1;
    setLegs([
      ...legs,
      {
        id: nextId,
        fromPoint: prevTo,
        toPoint: '',
        mode: 'airplane',
        departureTime: '',
        arrivalTime: '',
        estimatedBudget: '',
        preferredServiceUrl: '',
        notes: '',
      },
    ]);
  };

  const handleUpdateLeg = (id, field, value) => {
    setLegs(legs.map((leg) => (leg.id === id ? { ...leg, [field]: value } : leg)));
  };

  const handleRemoveLeg = (id) => {
    if (legs.length <= 1) return;
    setLegs(legs.filter((leg) => leg.id !== id));
  };

  // Live Budget Calculation
  const totalLegsBudget = legs.reduce(
    (sum, leg) => sum + (parseFloat(leg.estimatedBudget) || 0),
    0
  );
  const totalStayBudget = parseFloat(stayPlan.hotelBudget) || 0;
  const grandTotalBudget = totalLegsBudget + totalStayBudget;

  const handleSubmitPlanTrip = async () => {
    if (!plannedTripName.trim()) {
      showAlert('Notice', 'Please provide a trip name.');
      return;
    }
    setSaving(true);
    setSuccessMessage(null);
    try {
      const payload = {
        trip_name: plannedTripName.trim(),
        start_date: planStartDate.trim(),
        people_count: parseInt(planPeopleCount) || 1,
        legs: legs.map((leg, idx) => ({
          leg_index: idx + 1,
          from_point: leg.fromPoint,
          to_point: leg.toPoint,
          mode: leg.mode,
          departure_time: leg.departureTime,
          arrival_time: leg.arrivalTime,
          estimated_budget: parseFloat(leg.estimatedBudget) || 0.0,
          preferred_service_url: leg.preferredServiceUrl ? leg.preferredServiceUrl.trim() : '',
          notes: leg.notes,
        })),
        stay_plan: {
          city_or_hotel: stayPlan.cityOrHotel,
          days_count: parseInt(stayPlan.daysCount) || 1,
          people_count: parseInt(stayPlan.peopleCount) || 1,
          hotel_budget: parseFloat(stayPlan.hotelBudget) || 0.0,
          checkin_date: stayPlan.checkinDate,
          checkout_date: stayPlan.checkoutDate,
          preferred_service_url: stayPlan.preferredServiceUrl ? stayPlan.preferredServiceUrl.trim() : '',
        },
        notes: `Chronological ${legs.length}-leg itinerary with stay in ${stayPlan.cityOrHotel}`,
      };

      const res = await tripApi.createPlannedTrip(payload, token);
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`✅ Multi-leg journey (${legs.length} legs) saved in TripSaathi MongoDB!`);
        setTimeout(() => {
          if (onAddTripSuccess) onAddTripSuccess();
        }, 1800);
      } else {
        showAlert('Error', data.detail || 'Could not save journey plan');
      }
    } catch (e) {
      showAlert('Error', 'Network error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  return (
    <View style={styles.activeScreenBox}>
      {/* Title */}
      <View style={styles.screenTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.screenTitleSerif}>Add Trip</Text>
          <TouchableOpacity
            style={styles.placeholderToggleWrap}
            onPress={() => setShowPlaceholders(!showPlaceholders)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.placeholderToggleTrack,
                showPlaceholders && styles.placeholderToggleTrackActive,
              ]}
            >
              <View
                style={[
                  styles.placeholderToggleThumb,
                  showPlaceholders && styles.placeholderToggleThumbActive,
                ]}
              />
            </View>
            <Text style={styles.placeholderToggleLabel}>
              {showPlaceholders ? 'Show' : 'Hide'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.screenStepBadge}>STAGE 01</Text>
      </View>

      {/* TWO OPTIONS SELECTOR */}
      <View style={styles.tripModeSwitcher}>
        <TouchableOpacity
          style={[
            styles.tripModeBtn,
            activeMode === 'UPLOAD_TICKETS' && styles.tripModeBtnActive,
          ]}
          onPress={() => {
            setActiveMode('UPLOAD_TICKETS');
            setSuccessMessage(null);
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tripModeBtnText,
              activeMode === 'UPLOAD_TICKETS' && styles.tripModeBtnTextActive,
            ]}
          >
            🎟️ Upload / Booked Tickets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tripModeBtn,
            activeMode === 'PLAN_TRIP' && styles.tripModeBtnActive,
          ]}
          onPress={() => {
            setActiveMode('PLAN_TRIP');
            setSuccessMessage(null);
          }}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tripModeBtnText,
              activeMode === 'PLAN_TRIP' && styles.tripModeBtnTextActive,
            ]}
          >
            🧭 Plan Multi-Leg Trip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Success Notification Banner */}
      {successMessage && (
        <View style={styles.feedbackSuccessBanner}>
          <Text style={styles.feedbackSuccessText}>{successMessage}</Text>
        </View>
      )}

      {/* ======================================================= */}
      {/* OPTION 1: UPLOAD / MONITOR EXISTING BOOKED TICKETS     */}
      {/* ======================================================= */}
      {activeMode === 'UPLOAD_TICKETS' && (
        <View>
          {/* Trip Name with clean underline input (no box graphics) */}
          <View style={styles.ticketFieldGroup}>
            <Text style={styles.underlineKicker}>TRIP REFERENCE NAME</Text>
            <TextInput
              style={styles.ticketUnderlineInput}
              value={existingTripName}
              onChangeText={setExistingTripName}
              placeholder={ph('Type trip reference name (e.g. Mumbai Conference / Goa Vacation)')}
              placeholderTextColor="#C4BCB3"
            />
          </View>

          {/* Dynamic Tickets List */}
          <Text style={[styles.fieldKicker, { marginTop: 14, marginBottom: 8 }]}>
            CONFIRMED TICKETS ({tickets.length})
          </Text>

          {tickets.map((t, index) => {
            const currentCat = TICKET_CATEGORIES.find((c) => c.id === t.category) || TICKET_CATEGORIES[0];
            return (
              <View key={t.id} style={styles.smartLegCard}>
                {/* Header Strip */}
                <View style={styles.smartLegCardHeader}>
                  <View style={styles.smartLegBadgeRow}>
                    <View style={styles.smartLegIndexPill}>
                      <Text style={styles.smartLegIndexPillText}>
                        TICKET #{String(index + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <Text style={styles.smartLegTitleText}>
                      {currentCat.icon} {currentCat.label} Details
                    </Text>
                  </View>

                  {tickets.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveTicket(t.id)}
                      style={styles.smartLegRemoveBtn}
                    >
                      <Text style={styles.smartLegRemoveText}>✕ Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tactile Category Tiles (Flight, Train, Hotel, Cab, Bus) - Just like PlanMulti-Leg */}
                <View style={styles.transportTilesRow}>
                  {TICKET_CATEGORIES.map((cat) => {
                    const isSelected = t.category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.transportTile,
                          isSelected && styles.transportTileActive,
                        ]}
                        onPress={() => handleUpdateTicket(t.id, 'category', cat.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.transportTileIcon}>{cat.icon}</Text>
                        <Text
                          style={[
                            styles.transportTileLabel,
                            isSelected && styles.transportTileLabelActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Side-by-Side Radio Button Switcher: Manual Entry vs Attachment */}
                <View style={styles.radioGroupRow}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleUpdateTicket(t.id, 'entryMode', 'manual')}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        t.entryMode === 'manual' && styles.radioCircleActive,
                      ]}
                    >
                      {t.entryMode === 'manual' && <View style={styles.radioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.radioLabel,
                        t.entryMode === 'manual' && styles.radioLabelActive,
                      ]}
                    >
                      Manual Entry
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleUpdateTicket(t.id, 'entryMode', 'attachment')}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        t.entryMode === 'attachment' && styles.radioCircleActive,
                      ]}
                    >
                      {t.entryMode === 'attachment' && <View style={styles.radioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.radioLabel,
                        t.entryMode === 'attachment' && styles.radioLabelActive,
                      ]}
                    >
                      Attachment (PDF Auto-Scan)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ATTACHMENT VIEW: PDF Upload Zone */}
                {t.entryMode === 'attachment' && (
                  <View style={{ paddingHorizontal: 4 }}>
                    {t.isScanning ? (
                      <View style={styles.pdfScanningCard}>
                        <ActivityIndicator size="large" color={THEME.primary} />
                        <Text style={styles.pdfScanningText}>
                          Scanning ticket with AI (gpt-5-nano)...
                        </Text>
                        <Text style={styles.pdfScanningSub}>
                          Extracting text with pypdf and structuring fields with GPT
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.pdfUploadCard}>
                        <Text style={styles.pdfUploadIcon}>📄</Text>
                        <Text style={styles.pdfUploadTitle}>
                          Upload Confirmed Ticket (PDF)
                        </Text>
                        <Text style={styles.pdfUploadSubtitle}>
                          Select your airline boarding pass, IRCTC railway ticket, or hotel voucher PDF.
                          TripSaathi AI will automatically extract details and populate manual fields.
                        </Text>

                        {t.scanError && (
                          <View
                            style={{
                              backgroundColor: '#FEE2E2',
                              padding: 8,
                              borderRadius: 6,
                              marginTop: 8,
                              borderWidth: 1,
                              borderColor: '#EF4444',
                            }}
                          >
                            <Text style={{ fontSize: 11, color: '#B91C1C', textAlign: 'center' }}>
                              ⚠️ {t.scanError}
                            </Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={styles.pdfUploadBtn}
                          onPress={() => handlePickPdf(t.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.pdfUploadBtnText}>
                            📁 Choose & Scan Ticket PDF
                          </Text>
                        </TouchableOpacity>

                        {t.documentName ? (
                          <View style={[styles.attachedFileBadge, { marginTop: 12, width: '100%' }]}>
                            <Text style={styles.attachedFileText}>
                              📄 Already attached: {t.documentName}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleUpdateTicket(t.id, 'entryMode', 'manual')}
                            >
                              <Text style={{ color: THEME.primary, fontSize: 11, fontWeight: '700' }}>
                                View Fields →
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                )}

                {/* MANUAL VIEW: Underline input fields with Yellow Exclamation for missing fields */}
                {t.entryMode === 'manual' && (
                  <View style={{ paddingHorizontal: 4 }}>
                    {/* Scan Notice banner if populated by AI */}
                    {t.scanNotice && (
                      <View
                        style={{
                          backgroundColor: t.missingFields.length > 0 ? '#FFFBEB' : '#ECFDF5',
                          borderWidth: 1,
                          borderColor: t.missingFields.length > 0 ? '#F59E0B' : '#10B981',
                          borderRadius: 8,
                          padding: 8,
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: t.missingFields.length > 0 ? '#B45309' : '#047857',
                          }}
                        >
                          {t.scanNotice}
                        </Text>
                      </View>
                    )}

                    {/* Attached file status tag */}
                    {t.documentName ? (
                      <View style={[styles.attachedFileBadge, { marginBottom: 12 }]}>
                        <Text style={styles.attachedFileText}>
                          📄 Scanned Document: {t.documentName}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            handleUpdateTicket(t.id, 'documentName', '');
                            handleUpdateTicket(t.id, 'scanNotice', null);
                          }}
                        >
                          <Text style={{ color: '#B3261E', fontSize: 11, fontWeight: '700' }}>✕ Clear</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {/* Provider & Ticket/PNR Row */}
                    <View style={styles.formInputRow}>
                      <View style={styles.formInputCol}>
                        <View style={styles.ticketFieldLabelRow}>
                          <Text style={styles.underlineKicker}>
                            {t.category === 'hotel' ? 'HOTEL / BRAND' : 'PROVIDER / CARRIER'}
                          </Text>
                          {t.missingFields.includes('provider') && (
                            <View style={styles.missingWarningBadge}>
                              <Text style={styles.missingWarningText}>⚠️ Missing</Text>
                            </View>
                          )}
                        </View>
                        <TextInput
                          style={[
                            styles.ticketUnderlineInput,
                            t.missingFields.includes('provider') && styles.ticketUnderlineInputWarning,
                          ]}
                          value={t.provider}
                          onChangeText={(val) => handleUpdateTicket(t.id, 'provider', val)}
                          placeholder={
                            ph(t.category === 'hotel' ? 'Taj, Marriott, etc.' : 'IndiGo, IRCTC, etc.')
                          }
                          placeholderTextColor="#C4BCB3"
                        />
                      </View>

                      <View style={styles.formInputCol}>
                        <View style={styles.ticketFieldLabelRow}>
                          <Text style={styles.underlineKicker}>
                            {t.category === 'hotel' ? 'BOOKING CONFIRMATION' : 'PNR / TICKET NUMBER'}
                          </Text>
                          {t.missingFields.includes('ticketNumber') && (
                            <View style={styles.missingWarningBadge}>
                              <Text style={styles.missingWarningText}>⚠️ Missing</Text>
                            </View>
                          )}
                        </View>
                        <TextInput
                          style={[
                            styles.ticketUnderlineInput,
                            t.missingFields.includes('ticketNumber') && styles.ticketUnderlineInputWarning,
                          ]}
                          value={t.ticketNumber}
                          onChangeText={(val) => handleUpdateTicket(t.id, 'ticketNumber', val)}
                          placeholder={ph('e.g. 6E-XY9821 / HTL-5412')}
                          placeholderTextColor="#C4BCB3"
                        />
                      </View>
                    </View>

                    {/* From & To Row */}
                    <View style={styles.formInputRow}>
                      <View style={styles.formInputCol}>
                        <View style={styles.ticketFieldLabelRow}>
                          <Text style={styles.underlineKicker}>
                            {t.category === 'hotel' ? 'CITY / LOCATION' : 'FROM / ORIGIN'}
                          </Text>
                          {t.missingFields.includes('fromLocation') && (
                            <View style={styles.missingWarningBadge}>
                              <Text style={styles.missingWarningText}>⚠️ Missing</Text>
                            </View>
                          )}
                        </View>
                        <TextInput
                          style={[
                            styles.ticketUnderlineInput,
                            t.missingFields.includes('fromLocation') && styles.ticketUnderlineInputWarning,
                          ]}
                          value={t.fromLocation}
                          onChangeText={(val) => handleUpdateTicket(t.id, 'fromLocation', val)}
                          placeholder={ph('Departure origin location')}
                          placeholderTextColor="#C4BCB3"
                        />
                      </View>

                      <View style={styles.formInputCol}>
                        <View style={styles.ticketFieldLabelRow}>
                          <Text style={styles.underlineKicker}>
                            {t.category === 'hotel' ? 'HOTEL ADDRESS' : 'TO / DESTINATION'}
                          </Text>
                          {t.missingFields.includes('toLocation') && (
                            <View style={styles.missingWarningBadge}>
                              <Text style={styles.missingWarningText}>⚠️ Missing</Text>
                            </View>
                          )}
                        </View>
                        <TextInput
                          style={[
                            styles.ticketUnderlineInput,
                            t.missingFields.includes('toLocation') && styles.ticketUnderlineInputWarning,
                          ]}
                          value={t.toLocation}
                          onChangeText={(val) => handleUpdateTicket(t.id, 'toLocation', val)}
                          placeholder={ph('Arrival destination location')}
                          placeholderTextColor="#C4BCB3"
                        />
                      </View>
                    </View>

                    {/* Departure & Arrival Row */}
                    <View style={styles.formInputRow}>
                      <View style={styles.formInputCol}>
                        <View style={styles.ticketFieldLabelRow}>
                          <Text style={styles.underlineKicker}>
                            {t.category === 'hotel' ? 'CHECK-IN DATE & TIME' : 'DEPARTURE TIME'}
                          </Text>
                          {t.missingFields.includes('departureTime') && (
                            <View style={styles.missingWarningBadge}>
                              <Text style={styles.missingWarningText}>⚠️ Missing</Text>
                            </View>
                          )}
                        </View>
                        <DateTimePickerUnderline
                          mode="datetime"
                          value={t.departureTime}
                          onChange={(val) => handleUpdateTicket(t.id, 'departureTime', val)}
                          placeholder={ph('Select departure date & time')}
                          hasWarning={t.missingFields.includes('departureTime')}
                        />
                      </View>

                      <View style={styles.formInputCol}>
                        <View style={styles.ticketFieldLabelRow}>
                          <Text style={styles.underlineKicker}>
                            {t.category === 'hotel' ? 'CHECK-OUT DATE & TIME' : 'ARRIVAL TIME'}
                          </Text>
                          {t.missingFields.includes('arrivalTime') && (
                            <View style={styles.missingWarningBadge}>
                              <Text style={styles.missingWarningText}>⚠️ Missing</Text>
                            </View>
                          )}
                        </View>
                        <DateTimePickerUnderline
                          mode="datetime"
                          value={t.arrivalTime}
                          onChange={(val) => handleUpdateTicket(t.id, 'arrivalTime', val)}
                          placeholder={ph('Select arrival date & time')}
                          hasWarning={t.missingFields.includes('arrivalTime')}
                        />
                      </View>
                    </View>

                    {/* Seat or Room */}
                    <View style={styles.ticketFieldGroup}>
                      <View style={styles.ticketFieldLabelRow}>
                        <Text style={styles.underlineKicker}>
                          {t.category === 'hotel'
                            ? 'ROOM TYPE / ROOM NUMBER'
                            : 'SEAT / COACH / BERTH NUMBER'}
                        </Text>
                        {t.missingFields.includes('seatOrRoom') && (
                          <View style={styles.missingWarningBadge}>
                            <Text style={styles.missingWarningText}>⚠️ Missing</Text>
                          </View>
                        )}
                      </View>
                      <TextInput
                        style={[
                          styles.ticketUnderlineInput,
                          t.missingFields.includes('seatOrRoom') && styles.ticketUnderlineInputWarning,
                        ]}
                        value={t.seatOrRoom}
                        onChangeText={(val) => handleUpdateTicket(t.id, 'seatOrRoom', val)}
                        placeholder={ph('e.g. 14F (Window) / Coach B2 Seat 45 / Room 402')}
                        placeholderTextColor="#C4BCB3"
                      />
                    </View>

                    {/* Additional Notes (Optional) */}
                    <View style={styles.ticketFieldGroup}>
                      <Text style={styles.underlineKicker}>PASSENGER / ADDITIONAL NOTES (OPTIONAL)</Text>
                      <TextInput
                        style={styles.ticketUnderlineInput}
                        value={t.notes}
                        onChangeText={(val) => handleUpdateTicket(t.id, 'notes', val)}
                        placeholder={ph('e.g. Passenger names, terminal, gate, baggage details')}
                        placeholderTextColor="#C4BCB3"
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          {/* Add Another Ticket Button */}
          <TouchableOpacity
            style={styles.addAnotherDashedBtn}
            onPress={handleAddTicket}
          >
            <Text style={styles.addAnotherDashedBtnText}>+ Add Another Ticket (Plane / Train / Hotel / Cab)</Text>
          </TouchableOpacity>

          {/* Submit Existing Trip CTA */}
          <TouchableOpacity
            style={styles.primaryTerracottaBtn}
            onPress={handleSubmitExistingTrip}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryTerracottaBtnText}>
                💾 Save Booked Trip for Live Monitoring ({tickets.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ======================================================= */}
      {/* OPTION 2: PLAN MULTI-LEG CHRONOLOGICAL TRIP            */}
      {/* ======================================================= */}
      {activeMode === 'PLAN_TRIP' && (
        <View>
          {/* 1. INTERACTIVE TRANSIT SUBWAY / TIMELINE MAP */}
          <View style={styles.routeMapCard}>
            <View style={styles.routeMapHeaderRow}>
              <Text style={styles.routeMapKicker}>LIVE ROUTE TIMELINE</Text>
              <View style={styles.routeMapBadgePill}>
                <Text style={styles.routeMapBadgeText}>
                  {legs.length} Legs • ₹{grandTotalBudget.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routeNodesScroll}
            >
              {legs.map((leg, idx) => {
                const modeObj = TRANSPORT_MODES.find((m) => m.id === leg.mode) || TRANSPORT_MODES[0];
                const fromLabel = leg.fromPoint?.trim()
                  ? leg.fromPoint.split(' ')[0]
                  : `Pt ${String.fromCharCode(65 + idx)}`;
                const toLabel = leg.toPoint?.trim()
                  ? leg.toPoint.split(' ')[0]
                  : `Pt ${String.fromCharCode(66 + idx)}`;

                return (
                  <React.Fragment key={`subway-${leg.id}`}>
                    {/* Node: Departure */}
                    <View style={styles.routeNodeBox}>
                      <View style={styles.routeNodeDot}>
                        <Text style={styles.routeNodeIcon}>
                          {idx === 0 ? '🏠' : modeObj.icon}
                        </Text>
                      </View>
                      <Text style={styles.routeNodeLabel} numberOfLines={1}>
                        {fromLabel}
                      </Text>
                      <Text style={styles.routeNodeSub}>
                        {formatTransitNodeTime(leg.departureTime)}
                      </Text>
                    </View>

                    {/* Transit Connector Line with Mode Badge & Budget */}
                    <View style={styles.routeConnectorBox}>
                      <View style={styles.routeConnectorLine} />
                      <View style={styles.routeConnectorBadge}>
                        <Text style={styles.routeConnectorText}>
                          {modeObj.icon} {leg.estimatedBudget ? `₹${leg.estimatedBudget}` : '—'}
                        </Text>
                      </View>
                    </View>

                    {/* Final Node for last leg */}
                    {idx === legs.length - 1 && (
                      <View style={styles.routeNodeBox}>
                        <View style={[styles.routeNodeDot, { borderColor: '#F59E0B' }]}>
                          <Text style={styles.routeNodeIcon}>🏨</Text>
                        </View>
                        <Text style={styles.routeNodeLabel} numberOfLines={1}>
                          {toLabel}
                        </Text>
                        <Text style={styles.routeNodeSub}>
                          {formatTransitNodeTime(leg.arrivalTime)}
                        </Text>
                      </View>
                    )}
                  </React.Fragment>
                );
              })}
            </ScrollView>
          </View>

          {/* 2. TRIP BLUEPRINT HERO CARD */}
          <View style={styles.tripBlueprintHero}>
            <View style={styles.tripBlueprintKickerRow}>
              <Text style={styles.tripBlueprintKicker}>MASTER BLUEPRINT</Text>
              <Text style={styles.tripBlueprintTag}>Multi-Modal Chronological</Text>
            </View>

            <TextInput
              style={styles.tripBlueprintTitleInput}
              value={plannedTripName}
              onChangeText={setPlannedTripName}
              placeholder={ph('Trip title (e.g. Delhi to Mumbai Tour)')}
              placeholderTextColor="#B0A89F"
            />

            <View style={styles.tripMetaPillRow}>
              <View style={[styles.tripMetaPill, { minWidth: 160 }]}>
                <DateTimePickerUnderline
                  mode="date"
                  value={planStartDate}
                  onChange={setPlanStartDate}
                  placeholder={ph('Trip start date')}
                />
              </View>
              <View style={styles.tripMetaPill}>
                <Text style={styles.tripMetaIcon}>👥</Text>
                <TextInput
                  style={styles.tripMetaInput}
                  value={planPeopleCount}
                  onChangeText={setPlanPeopleCount}
                  placeholder={ph('2')}
                  keyboardType="numeric"
                  placeholderTextColor="#B0A89F"
                />
                <Text style={{ fontSize: 10, color: THEME.textMuted }}>travelers</Text>
              </View>
            </View>
          </View>

          {/* 3. CHRONOLOGICAL BOARDING PASS LEGS */}
          <Text style={[styles.fieldKicker, { marginTop: 6, marginBottom: 8 }]}>
            TRANSIT CONNECTIONS ({legs.length} LEGS)
          </Text>

          {legs.map((leg, idx) => {
            const currentMode = TRANSPORT_MODES.find((m) => m.id === leg.mode) || TRANSPORT_MODES[0];
            return (
              <View key={leg.id} style={styles.smartLegCard}>
                {/* Header Strip */}
                <View style={styles.smartLegCardHeader}>
                  <View style={styles.smartLegBadgeRow}>
                    <View style={styles.smartLegIndexPill}>
                      <Text style={styles.smartLegIndexPillText}>
                        LEG {String(idx + 1).padStart(2, '0')}
                      </Text>
                    </View>
                    <Text style={styles.smartLegTitleText}>
                      Point {String.fromCharCode(65 + idx)} → Point {String.fromCharCode(66 + idx)}
                    </Text>
                  </View>

                  {legs.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveLeg(leg.id)}
                      style={styles.smartLegRemoveBtn}
                    >
                      <Text style={styles.smartLegRemoveText}>✕ Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Tactile Transport Mode Switcher Tiles */}
                <View style={styles.transportTilesRow}>
                  {TRANSPORT_MODES.map((m) => {
                    const isSelected = leg.mode === m.id;
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.transportTile,
                          isSelected && styles.transportTileActive,
                        ]}
                        onPress={() => handleUpdateLeg(leg.id, 'mode', m.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.transportTileIcon}>{m.icon}</Text>
                        <Text
                          style={[
                            styles.transportTileLabel,
                            isSelected && styles.transportTileLabelActive,
                          ]}
                        >
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Boarding Pass Origin → Destination with Underlines */}
                <View style={styles.legBoardingBody}>
                  <View style={styles.underlineRouteContainer}>
                    {/* Origin Box */}
                    <View style={styles.underlineStationCol}>
                      <Text style={styles.underlineKicker}>
                        DEPARTURE (PT {String.fromCharCode(65 + idx)})
                      </Text>
                      <TextInput
                        style={styles.stationUnderlineInput}
                        value={leg.fromPoint}
                        onChangeText={(val) => handleUpdateLeg(leg.id, 'fromPoint', val)}
                        placeholder={ph('Type departure location')}
                        placeholderTextColor="#B0A89F"
                      />
                      <View style={{ marginTop: 4, width: '100%' }}>
                        <DateTimePickerUnderline
                          mode="datetime"
                          value={leg.departureTime}
                          defaultDate={planStartDate}
                          onChange={(val) => handleUpdateLeg(leg.id, 'departureTime', val)}
                          placeholder={ph('Departure Date & Time')}
                        />
                      </View>
                    </View>

                    {/* Directional Midway Arrow */}
                    <View style={styles.underlineMidwayBox}>
                      <Text style={styles.underlineMidwayIcon}>{currentMode.icon}</Text>
                      <View style={styles.underlineMidwayLine} />
                    </View>

                    {/* Destination Box */}
                    <View style={[styles.underlineStationCol, { alignItems: 'flex-end' }]}>
                      <Text style={styles.underlineKicker}>
                        ARRIVAL (PT {String.fromCharCode(66 + idx)})
                      </Text>
                      <TextInput
                        style={[styles.stationUnderlineInput, { textAlign: 'right' }]}
                        value={leg.toPoint}
                        onChangeText={(val) => handleUpdateLeg(leg.id, 'toPoint', val)}
                        placeholder={ph('Type arrival location')}
                        placeholderTextColor="#B0A89F"
                      />
                      <View style={{ marginTop: 4, width: '100%', alignItems: 'flex-end' }}>
                        <DateTimePickerUnderline
                          mode="datetime"
                          value={leg.arrivalTime}
                          defaultDate={leg.departureTime || planStartDate}
                          onChange={(val) => handleUpdateLeg(leg.id, 'arrivalTime', val)}
                          placeholder={ph('Arrival Date & Time')}
                          alignRight={true}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Budget Underline Strip */}
                  <View style={styles.underlineBudgetRow}>
                    <Text style={styles.underlineKicker}>ESTIMATED BUDGET</Text>
                    <View style={styles.underlineBudgetBox}>
                      <Text style={styles.underlineRupeeSign}>₹</Text>
                      <TextInput
                        style={styles.budgetUnderlineInput}
                        value={leg.estimatedBudget}
                        onChangeText={(val) => handleUpdateLeg(leg.id, 'estimatedBudget', val)}
                        placeholder={ph('0')}
                        keyboardType="numeric"
                        placeholderTextColor="#B0A89F"
                      />
                    </View>
                  </View>

                  {/* Preferred Service / Booking Website Link Strip (Optional) */}
                  <View style={styles.underlinePreferredServiceRow}>
                    <View style={styles.underlinePreferredServiceHeader}>
                      <Text style={styles.underlineKicker}>
                        🔗 PREFERRED {currentMode.label.toUpperCase()} SERVICE / LINK (OPTIONAL)
                      </Text>
                      {leg.preferredServiceUrl?.trim().length > 0 && (
                        <Text style={styles.preferredServiceBadge}>Custom Provider</Text>
                      )}
                    </View>
                    <TextInput
                      style={styles.stationUnderlineInput}
                      value={leg.preferredServiceUrl}
                      onChangeText={(val) => handleUpdateLeg(leg.id, 'preferredServiceUrl', val)}
                      placeholder={ph(
                        currentMode.id === 'airplane'
                          ? 'e.g. https://www.airindia.com or makemytrip.com'
                          : currentMode.id === 'train'
                          ? 'e.g. https://www.irctc.co.in or confirmtkt.com'
                          : currentMode.id === 'cab'
                          ? 'e.g. https://www.uber.com or ola.com'
                          : currentMode.id === 'bus'
                          ? 'e.g. https://www.redbus.in or zingbus.com'
                          : 'e.g. Website link you prefer to book with'
                      )}
                      placeholderTextColor="#B0A89F"
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                </View>
              </View>
            );
          })}

          {/* 4. SMART NEXT LEG CTA */}
          <TouchableOpacity
            style={styles.smartAddLegCard}
            onPress={handleAddLeg}
            activeOpacity={0.8}
          >
            <Text style={styles.smartAddLegPrompt}>
              {legs[legs.length - 1]?.toPoint
                ? `Next connection departs from: 📍 ${legs[legs.length - 1].toPoint}`
                : `Add another connection to your journey`}
            </Text>
            <Text style={styles.smartAddLegBtnText}>
              + Add Connection (Point {String.fromCharCode(65 + legs.length)} → Point {String.fromCharCode(66 + legs.length)})
            </Text>
          </TouchableOpacity>

          {/* 5. VIP HOTEL / STAY SHOWCASE CARD */}
          <View style={styles.luxuryHotelCard}>
            <View style={styles.luxuryHotelHeader}>
              <Text style={styles.luxuryHotelKicker}>🏨 ACCOMMODATION & STAY</Text>
              <View style={styles.luxuryHotelBadge}>
                <Text style={styles.luxuryHotelBadgeText}>RECOVERY BASE</Text>
              </View>
            </View>

            <View style={styles.luxuryHotelBody}>
              <View style={styles.hotelNameInputBox}>
                <Text style={styles.inputSmallLabel}>HOTEL / DESTINATION VENUE</Text>
                <TextInput
                  style={styles.stationUnderlineInput}
                  value={stayPlan.cityOrHotel}
                  onChangeText={(val) => setStayPlan({ ...stayPlan, cityOrHotel: val })}
                  placeholder={ph('Enter hotel name or city')}
                  placeholderTextColor="#B0A89F"
                />
              </View>

              <View style={styles.hotelMetricsGrid}>
                <View style={styles.hotelMetricTile}>
                  <Text style={styles.hotelMetricTileLabel}>DURATION</Text>
                  <TextInput
                    style={styles.hotelMetricTileVal}
                    value={stayPlan.daysCount}
                    onChangeText={(val) => setStayPlan({ ...stayPlan, daysCount: val })}
                    placeholder={ph('Nights (e.g. 3)')}
                    keyboardType="numeric"
                    placeholderTextColor="#B0A89F"
                  />
                </View>

                <View style={styles.hotelMetricTile}>
                  <Text style={styles.hotelMetricTileLabel}>STAY BUDGET (₹)</Text>
                  <TextInput
                    style={styles.hotelMetricTileVal}
                    value={stayPlan.hotelBudget}
                    onChangeText={(val) => setStayPlan({ ...stayPlan, hotelBudget: val })}
                    placeholder={ph('0')}
                    keyboardType="numeric"
                    placeholderTextColor="#B0A89F"
                  />
                </View>

                <View style={styles.hotelMetricTile}>
                  <Text style={styles.hotelMetricTileLabel}>CHECK-IN DATE</Text>
                  <DateTimePickerUnderline
                    mode="date"
                    value={stayPlan.checkinDate}
                    onChange={(val) => setStayPlan({ ...stayPlan, checkinDate: val })}
                    placeholder={ph('Check-in date')}
                  />
                </View>
              </View>

              {/* Preferred Hotel Booking Link Strip (Optional) */}
              <View style={[styles.underlinePreferredServiceRow, { marginTop: 14 }]}>
                <View style={styles.underlinePreferredServiceHeader}>
                  <Text style={styles.inputSmallLabel}>
                    🔗 PREFERRED HOTEL / STAY BOOKING LINK (OPTIONAL)
                  </Text>
                  {stayPlan.preferredServiceUrl?.trim().length > 0 && (
                    <Text style={styles.preferredServiceBadge}>Custom Provider</Text>
                  )}
                </View>
                <TextInput
                  style={styles.stationUnderlineInput}
                  value={stayPlan.preferredServiceUrl}
                  onChangeText={(val) => setStayPlan({ ...stayPlan, preferredServiceUrl: val })}
                  placeholder={ph('e.g. https://www.booking.com, agoda.com, or hotel website')}
                  placeholderTextColor="#B0A89F"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              <View style={styles.hotelPerksRow}>
                <View style={styles.hotelPerkPill}>
                  <Text style={styles.hotelPerkText}>✓ Auto Late Check-in Hold</Text>
                </View>
                <View style={styles.hotelPerkPill}>
                  <Text style={styles.hotelPerkText}>✓ Disruption Protected</Text>
                </View>
              </View>
            </View>
          </View>


          {/* 6. INTERACTIVE HUD / BUDGET PROGRESS VISUALIZER */}
          <View style={styles.journeyHudCard}>
            <View style={styles.journeyHudHeader}>
              <Text style={styles.journeyHudTitle}>TOTAL ESTIMATED BUDGET</Text>
              <Text style={styles.journeyHudGrandTotal}>
                ₹{grandTotalBudget.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Spending Proportion Bar */}
            <View style={styles.budgetProgressBarBox}>
              <View
                style={[
                  styles.budgetProgressTransport,
                  {
                    width: `${grandTotalBudget > 0 ? Math.round((totalLegsBudget / grandTotalBudget) * 100) : 50}%`,
                  },
                ]}
              />
              <View
                style={[
                  styles.budgetProgressStay,
                  {
                    width: `${grandTotalBudget > 0 ? 100 - Math.round((totalLegsBudget / grandTotalBudget) * 100) : 50}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.budgetBreakdownLegend}>
              <View style={styles.budgetLegendItem}>
                <View style={styles.budgetLegendDotTransport} />
                <Text style={styles.budgetLegendText}>
                  Transport: ₹{totalLegsBudget.toLocaleString('en-IN')} (
                  {grandTotalBudget > 0 ? Math.round((totalLegsBudget / grandTotalBudget) * 100) : 0}%)
                </Text>
              </View>
              <View style={styles.budgetLegendItem}>
                <View style={styles.budgetLegendDotStay} />
                <Text style={styles.budgetLegendText}>
                  Stay: ₹{totalStayBudget.toLocaleString('en-IN')} (
                  {grandTotalBudget > 0 ? 100 - Math.round((totalLegsBudget / grandTotalBudget) * 100) : 0}%)
                </Text>
              </View>
            </View>
          </View>

          {/* 7. PRIMARY SUBMIT CTA */}
          <TouchableOpacity
            style={styles.primaryTerracottaBtn}
            onPress={handleSubmitPlanTrip}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryTerracottaBtnText}>
                🚀 Save & Plan Trip in Database ({legs.length} Legs)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

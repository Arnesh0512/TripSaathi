import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { styles } from '../styles/appStyles';
import { THEME } from '../constants/theme';
import { tripApi } from '../services/api';

const TICKET_CATEGORIES = [
  { id: 'flight', label: '✈️ Flight' },
  { id: 'railway', label: '🚆 Train' },
  { id: 'hotel', label: '🏨 Hotel' },
  { id: 'cab', label: '🚕 Cab / Taxi' },
  { id: 'bus', label: '🚌 Bus' },
];

const TRANSPORT_MODES = [
  { id: 'cab', label: '🚕 Cab' },
  { id: 'airplane', label: '✈️ Airplane' },
  { id: 'train', label: '🚆 Train' },
  { id: 'bus', label: '🚌 Bus' },
];

export default function AddTripScreen({ token, onAddTripSuccess }) {
  // Option 1 vs Option 2 Mode
  const [activeMode, setActiveMode] = useState('UPLOAD_TICKETS'); // 'UPLOAD_TICKETS' | 'PLAN_TRIP'
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // ----------------------------------------------------
  // Option 1 State: Upload / Add Existing Booked Tickets
  // ----------------------------------------------------
  const [existingTripName, setExistingTripName] = useState('My Upcoming Journey');
  const [tickets, setTickets] = useState([
    {
      id: 1,
      category: 'flight',
      provider: 'IndiGo (6E-804)',
      ticketNumber: '6E-PNR-883921',
      fromLocation: 'DEL (Indira Gandhi T3)',
      toLocation: 'BOM (Chhatrapati Shivaji T2)',
      departureTime: '24 May 2025, 14:00',
      arrivalTime: '24 May 2025, 16:30',
      seatOrRoom: '14F (Window)',
      documentName: 'indigo_ticket_booking.pdf',
      notes: '',
    },
  ]);

  const handleAddTicket = () => {
    const nextId = tickets.length + 1;
    setTickets([
      ...tickets,
      {
        id: nextId,
        category: 'hotel',
        provider: 'Taj Lands End, Mumbai',
        ticketNumber: 'HTL-BOM-5412',
        fromLocation: 'B.J. Road, Bandra West, Mumbai',
        toLocation: 'B.J. Road, Bandra West, Mumbai',
        departureTime: '24 May 2025, 17:30',
        arrivalTime: '27 May 2025, 11:00',
        seatOrRoom: 'Deluxe Sea View (Room 402)',
        documentName: '',
        notes: '',
      },
    ]);
  };

  const handleUpdateTicket = (id, field, value) => {
    setTickets(
      tickets.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleRemoveTicket = (id) => {
    if (tickets.length <= 1) return;
    setTickets(tickets.filter((t) => t.id !== id));
  };

  const handleSimulateUpload = (id) => {
    const sampleDocs = [
      'e_ticket_boarding_pass.pdf',
      'irctc_rail_ticket.pdf',
      'hotel_booking_confirmation.pdf',
      'uber_trip_receipt.pdf',
    ];
    const picked = sampleDocs[Math.floor(Math.random() * sampleDocs.length)];
    handleUpdateTicket(id, 'documentName', picked);
  };

  const handleSubmitExistingTrip = async () => {
    if (!existingTripName.trim()) {
      showAlert('Notice', 'Please provide a trip name.');
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
  const [plannedTripName, setPlannedTripName] = useState('Delhi to Mumbai Multi-Modal Tour');
  const [planStartDate, setPlanStartDate] = useState('24 May 2025');
  const [planPeopleCount, setPlanPeopleCount] = useState('2');

  const [legs, setLegs] = useState([
    {
      id: 1,
      fromPoint: 'Home (Dwarka Sector 12)',
      toPoint: 'Delhi Airport (T3)',
      mode: 'cab',
      departureTime: '11:30',
      arrivalTime: '12:15',
      estimatedBudget: '650',
      notes: 'Pre-book Uber Premier',
    },
    {
      id: 2,
      fromPoint: 'DEL Airport (T3)',
      toPoint: 'BOM Airport (T2)',
      mode: 'airplane',
      departureTime: '14:00',
      arrivalTime: '16:15',
      estimatedBudget: '5400',
      notes: 'IndiGo / Air India non-stop',
    },
    {
      id: 3,
      fromPoint: 'BOM Airport (T2)',
      toPoint: 'Taj Lands End, Bandra',
      mode: 'cab',
      departureTime: '16:45',
      arrivalTime: '17:30',
      estimatedBudget: '500',
      notes: 'Airport prepaid cab counter',
    },
  ]);

  const [stayPlan, setStayPlan] = useState({
    cityOrHotel: 'Taj Lands End, Bandra',
    daysCount: '3',
    peopleCount: '2',
    hotelBudget: '15000',
    checkinDate: '24 May 2025',
    checkoutDate: '27 May 2025',
  });

  const handleAddLeg = () => {
    const lastLeg = legs[legs.length - 1];
    const prevTo = lastLeg ? lastLeg.toPoint : 'Point B';
    const nextId = legs.length + 1;
    setLegs([
      ...legs,
      {
        id: nextId,
        fromPoint: prevTo,
        toPoint: `Point ${String.fromCharCode(65 + legs.length + 1)}`,
        mode: 'cab',
        departureTime: '18:00',
        arrivalTime: '18:45',
        estimatedBudget: '400',
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
          notes: leg.notes,
        })),
        stay_plan: {
          city_or_hotel: stayPlan.cityOrHotel,
          days_count: parseInt(stayPlan.daysCount) || 1,
          people_count: parseInt(stayPlan.peopleCount) || 1,
          hotel_budget: parseFloat(stayPlan.hotelBudget) || 0.0,
          checkin_date: stayPlan.checkinDate,
          checkout_date: stayPlan.checkoutDate,
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
        <Text style={styles.screenTitleSerif}>Add Trip</Text>
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
          <View style={styles.modeHeroCard}>
            <Text style={styles.modeHeroTitle}>Already Booked? Monitor Your Journey</Text>
            <Text style={styles.modeHeroDesc}>
              Input as many confirmed tickets as you have (Plane, Train, Hotel, Cab). TripSaathi
              watches connection buffers and initiates recovery if a delay cascades.
            </Text>
          </View>

          {/* Trip Name */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldKicker}>TRIP REFERENCE NAME</Text>
            <TextInput
              style={styles.cleanTextInput}
              value={existingTripName}
              onChangeText={setExistingTripName}
              placeholder="e.g. Mumbai Conference / Goa Vacation"
              placeholderTextColor={THEME.textMuted}
            />
          </View>

          {/* Dynamic Tickets List */}
          <Text style={[styles.fieldKicker, { marginTop: 6, marginBottom: 8 }]}>
            CONFIRMED TICKETS ({tickets.length})
          </Text>

          {tickets.map((t, index) => (
            <View key={t.id} style={styles.ticketItemCard}>
              <View style={styles.ticketItemHeader}>
                <Text style={styles.ticketItemBadge}>TICKET #{index + 1}</Text>
                {tickets.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveTicket(t.id)}
                    style={styles.ticketRemoveBtn}
                  >
                    <Text style={styles.ticketRemoveBtnText}>✕ Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Pills */}
              <View style={styles.typePillRow}>
                {TICKET_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.typePill,
                      t.category === cat.id && styles.typePillActive,
                    ]}
                    onPress={() => handleUpdateTicket(t.id, 'category', cat.id)}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        t.category === cat.id && styles.typePillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Provider & PNR */}
              <View style={styles.formInputRow}>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>PROVIDER / CARRIER</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={t.provider}
                    onChangeText={(val) => handleUpdateTicket(t.id, 'provider', val)}
                    placeholder="e.g. IndiGo, IRCTC, Taj"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>PNR / BOOKING REF</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={t.ticketNumber}
                    onChangeText={(val) => handleUpdateTicket(t.id, 'ticketNumber', val)}
                    placeholder="e.g. 6E-883921"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
              </View>

              {/* From & To */}
              <View style={styles.formInputRow}>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>FROM / ORIGIN</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={t.fromLocation}
                    onChangeText={(val) => handleUpdateTicket(t.id, 'fromLocation', val)}
                    placeholder="DEL Airport / Station"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>TO / DESTINATION</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={t.toLocation}
                    onChangeText={(val) => handleUpdateTicket(t.id, 'toLocation', val)}
                    placeholder="BOM Airport / Hotel"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
              </View>

              {/* Departure & Arrival */}
              <View style={styles.formInputRow}>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>DEPARTURE / START</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={t.departureTime}
                    onChangeText={(val) => handleUpdateTicket(t.id, 'departureTime', val)}
                    placeholder="24 May 2025 14:00"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>ARRIVAL / END</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={t.arrivalTime}
                    onChangeText={(val) => handleUpdateTicket(t.id, 'arrivalTime', val)}
                    placeholder="24 May 2025 16:30"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
              </View>

              {/* Seat or Room */}
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.inputSmallLabel}>SEAT / COACH / ROOM NUMBER</Text>
                <TextInput
                  style={styles.cleanTextInput}
                  value={t.seatOrRoom}
                  onChangeText={(val) => handleUpdateTicket(t.id, 'seatOrRoom', val)}
                  placeholder="e.g. 14F (Window) / Room 402"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>

              {/* Document upload / attachment */}
              {t.documentName ? (
                <View style={styles.attachedFileBadge}>
                  <Text style={styles.attachedFileText}>📄 {t.documentName}</Text>
                  <TouchableOpacity onPress={() => handleUpdateTicket(t.id, 'documentName', '')}>
                    <Text style={{ color: '#B3261E', fontSize: 11, fontWeight: '700' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={() => handleSimulateUpload(t.id)}
                >
                  <Text style={styles.attachBtnText}>📎 Attach Ticket PDF / Image</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

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
          <View style={styles.modeHeroCard}>
            <Text style={styles.modeHeroTitle}>Interactive Multi-Leg Trip Builder</Text>
            <Text style={styles.modeHeroDesc}>
              Chain sequential journey legs in chronological order (Home → Airport Cab, Flight,
              Airport → Hotel Cab) with budget estimation and hotel stay planning.
            </Text>
          </View>

          {/* General Trip Info */}
          <View style={styles.formGroup}>
            <Text style={styles.fieldKicker}>TRIP TITLE</Text>
            <TextInput
              style={styles.cleanTextInput}
              value={plannedTripName}
              onChangeText={setPlannedTripName}
              placeholder="e.g. Delhi to Mumbai Business Trip"
              placeholderTextColor={THEME.textMuted}
            />
          </View>

          <View style={styles.formInputRow}>
            <View style={styles.formInputCol}>
              <Text style={styles.inputSmallLabel}>JOURNEY START DATE</Text>
              <TextInput
                style={styles.cleanTextInput}
                value={planStartDate}
                onChangeText={setPlanStartDate}
                placeholder="24 May 2025"
                placeholderTextColor={THEME.textMuted}
              />
            </View>
            <View style={styles.formInputCol}>
              <Text style={styles.inputSmallLabel}>TOTAL TRAVELERS</Text>
              <TextInput
                style={styles.cleanTextInput}
                value={planPeopleCount}
                onChangeText={setPlanPeopleCount}
                placeholder="2"
                keyboardType="numeric"
                placeholderTextColor={THEME.textMuted}
              />
            </View>
          </View>

          {/* CHRONOLOGICAL LEGS LIST */}
          <Text style={[styles.fieldKicker, { marginTop: 8, marginBottom: 8 }]}>
            JOURNEY LEGS IN CHRONOLOGICAL ORDER ({legs.length})
          </Text>

          {legs.map((leg, idx) => (
            <View key={leg.id} style={styles.legCard}>
              <View style={styles.legHeaderRow}>
                <Text style={styles.legIndexBadge}>
                  LEG {String(idx + 1).padStart(2, '0')} • POINT {String.fromCharCode(65 + idx)} → POINT {String.fromCharCode(66 + idx)}
                </Text>
                {legs.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemoveLeg(leg.id)}
                    style={styles.ticketRemoveBtn}
                  >
                    <Text style={styles.ticketRemoveBtnText}>✕ Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Mode Selection */}
              <View style={styles.typePillRow}>
                {TRANSPORT_MODES.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.typePill,
                      leg.mode === m.id && styles.typePillActive,
                    ]}
                    onPress={() => handleUpdateLeg(leg.id, 'mode', m.id)}
                  >
                    <Text
                      style={[
                        styles.typePillText,
                        leg.mode === m.id && styles.typePillTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* From & To */}
              <View style={styles.formInputRow}>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>FROM (POINT {String.fromCharCode(65 + idx)})</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={leg.fromPoint}
                    onChangeText={(val) => handleUpdateLeg(leg.id, 'fromPoint', val)}
                    placeholder="Origin location"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>TO (POINT {String.fromCharCode(66 + idx)})</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={leg.toPoint}
                    onChangeText={(val) => handleUpdateLeg(leg.id, 'toPoint', val)}
                    placeholder="Destination point"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
              </View>

              {/* Time & Budget */}
              <View style={styles.formInputRow}>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>DEPARTURE TIME</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={leg.departureTime}
                    onChangeText={(val) => handleUpdateLeg(leg.id, 'departureTime', val)}
                    placeholder="14:00"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>ARRIVAL TIME</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={leg.arrivalTime}
                    onChangeText={(val) => handleUpdateLeg(leg.id, 'arrivalTime', val)}
                    placeholder="16:15"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
                <View style={styles.formInputCol}>
                  <Text style={styles.inputSmallLabel}>EST. BUDGET (₹)</Text>
                  <TextInput
                    style={styles.cleanTextInput}
                    value={leg.estimatedBudget}
                    onChangeText={(val) => handleUpdateLeg(leg.id, 'estimatedBudget', val)}
                    placeholder="5400"
                    keyboardType="numeric"
                    placeholderTextColor={THEME.textMuted}
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Add Next Leg */}
          <TouchableOpacity
            style={styles.addAnotherDashedBtn}
            onPress={handleAddLeg}
          >
            <Text style={styles.addAnotherDashedBtnText}>
              + Add Next Leg (Point {String.fromCharCode(65 + legs.length)} → Point {String.fromCharCode(66 + legs.length)})
            </Text>
          </TouchableOpacity>

          {/* STAY / ACCOMMODATION SECTION */}
          <View style={styles.stayCard}>
            <Text style={styles.staySectionTitle}>🏨 STAY / HOTEL PLAN</Text>

            <View style={{ marginBottom: 8 }}>
              <Text style={styles.inputSmallLabel}>DESTINATION CITY / HOTEL NAME</Text>
              <TextInput
                style={styles.cleanTextInput}
                value={stayPlan.cityOrHotel}
                onChangeText={(val) => setStayPlan({ ...stayPlan, cityOrHotel: val })}
                placeholder="e.g. Taj Lands End, Bandra West"
                placeholderTextColor={THEME.textMuted}
              />
            </View>

            <View style={styles.formInputRow}>
              <View style={styles.formInputCol}>
                <Text style={styles.inputSmallLabel}>NUMBER OF DAYS / NIGHTS</Text>
                <TextInput
                  style={styles.cleanTextInput}
                  value={stayPlan.daysCount}
                  onChangeText={(val) => setStayPlan({ ...stayPlan, daysCount: val })}
                  placeholder="3"
                  keyboardType="numeric"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>
              <View style={styles.formInputCol}>
                <Text style={styles.inputSmallLabel}>HOTEL BUDGET (₹)</Text>
                <TextInput
                  style={styles.cleanTextInput}
                  value={stayPlan.hotelBudget}
                  onChangeText={(val) => setStayPlan({ ...stayPlan, hotelBudget: val })}
                  placeholder="15000"
                  keyboardType="numeric"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>
            </View>

            <View style={styles.formInputRow}>
              <View style={styles.formInputCol}>
                <Text style={styles.inputSmallLabel}>CHECK-IN DATE</Text>
                <TextInput
                  style={styles.cleanTextInput}
                  value={stayPlan.checkinDate}
                  onChangeText={(val) => setStayPlan({ ...stayPlan, checkinDate: val })}
                  placeholder="24 May 2025"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>
              <View style={styles.formInputCol}>
                <Text style={styles.inputSmallLabel}>CHECK-OUT DATE</Text>
                <TextInput
                  style={styles.cleanTextInput}
                  value={stayPlan.checkoutDate}
                  onChangeText={(val) => setStayPlan({ ...stayPlan, checkoutDate: val })}
                  placeholder="27 May 2025"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>
            </View>
          </View>

          {/* LIVE SUMMARY CARD */}
          <View style={styles.planSummaryCard}>
            <View style={styles.planSummaryRow}>
              <Text style={styles.planSummaryLabel}>Total Chronological Legs:</Text>
              <Text style={styles.planSummaryValue}>{legs.length} transport segments</Text>
            </View>
            <View style={styles.planSummaryRow}>
              <Text style={styles.planSummaryLabel}>Transport Budget:</Text>
              <Text style={styles.planSummaryValue}>₹{totalLegsBudget.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.planSummaryRow}>
              <Text style={styles.planSummaryLabel}>Accommodation Budget:</Text>
              <Text style={styles.planSummaryValue}>₹{totalStayBudget.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.planSummaryTotalRow}>
              <Text style={styles.planSummaryTotalLabel}>Estimated Total Budget:</Text>
              <Text style={styles.planSummaryTotalValue}>₹{grandTotalBudget.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* Submit Plan CTA */}
          <TouchableOpacity
            style={styles.primaryTerracottaBtn}
            onPress={handleSubmitPlanTrip}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryTerracottaBtnText}>
                💾 Save & Plan Trip in Database ({legs.length} Legs)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

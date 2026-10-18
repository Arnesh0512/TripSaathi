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

const TICKET_CATEGORIES = [
  { id: 'flight', label: '✈️ Flight' },
  { id: 'railway', label: '🚆 Train' },
  { id: 'hotel', label: '🏨 Hotel' },
  { id: 'cab', label: '🚕 Cab / Taxi' },
  { id: 'bus', label: '🚌 Bus' },
];

const TRANSPORT_MODES = [
  { id: 'cab', label: 'Cab', icon: '🚕', color: '#D97706' },
  { id: 'airplane', label: 'Flight', icon: '✈️', color: '#0284C7' },
  { id: 'train', label: 'Train', icon: '🚆', color: '#059669' },
  { id: 'bus', label: 'Bus', icon: '🚌', color: '#7C3AED' },
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
                      <Text style={styles.routeNodeSub}>{leg.departureTime || '--:--'}</Text>
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
                        <Text style={styles.routeNodeSub}>{leg.arrivalTime || '--:--'}</Text>
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
              placeholder="Trip title (e.g. Delhi to Mumbai Tour)"
              placeholderTextColor="#B0A89F"
            />

            <View style={styles.tripMetaPillRow}>
              <View style={styles.tripMetaPill}>
                <Text style={styles.tripMetaIcon}>📅</Text>
                <TextInput
                  style={styles.tripMetaInput}
                  value={planStartDate}
                  onChangeText={setPlanStartDate}
                  placeholder="Date (e.g. 24 May 2025)"
                  placeholderTextColor="#B0A89F"
                />
              </View>
              <View style={styles.tripMetaPill}>
                <Text style={styles.tripMetaIcon}>👥</Text>
                <TextInput
                  style={styles.tripMetaInput}
                  value={planPeopleCount}
                  onChangeText={setPlanPeopleCount}
                  placeholder="2"
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
                        placeholder="Type departure location"
                        placeholderTextColor="#B0A89F"
                      />
                      <View style={styles.timeUnderlineRow}>
                        <Text style={styles.timeIconPrefix}>🕒</Text>
                        <TextInput
                          style={styles.timeUnderlineInput}
                          value={leg.departureTime}
                          onChangeText={(val) => handleUpdateLeg(leg.id, 'departureTime', val)}
                          placeholder="Time (e.g. 11:30)"
                          placeholderTextColor="#C4BCB3"
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
                        placeholder="Type arrival location"
                        placeholderTextColor="#B0A89F"
                      />
                      <View style={[styles.timeUnderlineRow, { justifyContent: 'flex-end' }]}>
                        <Text style={styles.timeIconPrefix}>🕒</Text>
                        <TextInput
                          style={[styles.timeUnderlineInput, { textAlign: 'right' }]}
                          value={leg.arrivalTime}
                          onChangeText={(val) => handleUpdateLeg(leg.id, 'arrivalTime', val)}
                          placeholder="Time (e.g. 12:15)"
                          placeholderTextColor="#C4BCB3"
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
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor="#B0A89F"
                      />
                    </View>
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
                  placeholder="Enter hotel name or city"
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
                    placeholder="Nights (e.g. 3)"
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
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#B0A89F"
                  />
                </View>

                <View style={styles.hotelMetricTile}>
                  <Text style={styles.hotelMetricTileLabel}>CHECK-IN DATE</Text>
                  <TextInput
                    style={styles.hotelMetricTileVal}
                    value={stayPlan.checkinDate}
                    onChangeText={(val) => setStayPlan({ ...stayPlan, checkinDate: val })}
                    placeholder="e.g. 24 May"
                    placeholderTextColor="#B0A89F"
                  />
                </View>
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

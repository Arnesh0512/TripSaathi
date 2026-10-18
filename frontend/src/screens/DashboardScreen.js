import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { styles } from '../styles/appStyles';
import { THEME } from '../constants/theme';
import { tripApi } from '../services/api';

export default function DashboardScreen({
  token,
  user,
  dashboardSubtab = 'All Trips',
  setDashboardSubtab,
  onViewImpact,
  onNavigateToAddTrip,
}) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteNotice, setDeleteNotice] = useState(null);

  const targetEmail = user?.email || 'arnesh052006@gmail.com';

  const fetchTripsFromDb = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await tripApi.getMyTrips(token);
      const data = await res.json();
      if (res.ok && data.trips) {
        setTrips(data.trips);
      }
    } catch (err) {
      console.warn('Error fetching trips from MongoDB:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTripsFromDb();
  }, [token, user]);

  const handleDeleteTrip = (tripId, tripName) => {
    const confirmDelete = () => {
      performDelete(tripId, tripName);
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${tripName}" from TripSaathi MongoDB?`
      );
      if (confirmed) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Trip',
        `Are you sure you want to delete "${tripName}" from MongoDB?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  const performDelete = async (tripId, tripName) => {
    setDeletingId(tripId);
    try {
      const res = await tripApi.deleteTrip(tripId, token);
      if (res.ok) {
        // Remove locally from state
        setTrips((prev) => prev.filter((t) => t._id !== tripId));
        setDeleteNotice(`🗑️ "${tripName}" deleted from MongoDB.`);
        setTimeout(() => setDeleteNotice(null), 3000);
      } else {
        const errData = await res.json();
        showAlert('Error', errData.detail || 'Could not delete trip');
      }
    } catch (err) {
      showAlert('Error', 'Failed to connect to backend: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  // Separate Current Active trip from Past trips
  const currentTrips = trips.filter(
    (t) =>
      !t.is_past &&
      t.status !== 'COMPLETED' &&
      t.monitoring_status !== 'COMPLETED'
  );

  const pastTrips = trips.filter(
    (t) =>
      t.is_past === true ||
      t.status === 'COMPLETED' ||
      t.monitoring_status === 'COMPLETED'
  );

  // Subtab filtering
  const activeSubtab = dashboardSubtab || 'All Trips';
  const showCurrent = activeSubtab === 'All Trips' || activeSubtab === 'Active';
  const showPast = activeSubtab === 'All Trips' || activeSubtab === 'Past';

  return (
    <View style={styles.activeScreenBox}>
      {/* Screen Title & Step */}
      <View style={styles.screenTitleRow}>
        <View>
          <Text style={styles.screenTitleSerif}>Trip Dashboard</Text>
          <Text style={styles.impactSubText}>
            Connected multi-modal itineraries & past journey archive
          </Text>
        </View>
        <Text style={styles.screenStepBadge}>STAGE 02</Text>
      </View>

      {/* Database Sync & User Indicator Strip */}
      <View style={styles.dashboardDbSyncRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 13 }}>👤</Text>
          <Text style={styles.dashboardUserEmailText}>{targetEmail}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.dashboardDbConnectedBadge}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#047857' }} />
            <Text style={styles.dashboardDbConnectedText}>MONGODB LIVE</Text>
          </View>
          <TouchableOpacity
            onPress={() => fetchTripsFromDb(true)}
            disabled={refreshing}
            style={{ padding: 4 }}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#A83827" />
            ) : (
              <Text style={{ fontSize: 12 }}>🔄</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtabs Filter: All Trips | Active | Past */}
      <View style={styles.subtabsRow}>
        {[
          { id: 'All Trips', label: `All (${trips.length})` },
          { id: 'Active', label: `Active (${currentTrips.length})` },
          { id: 'Past', label: `Past (${pastTrips.length})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.subtabBtn,
              activeSubtab === tab.id && styles.subtabBtnActive,
            ]}
            onPress={() => setDashboardSubtab && setDashboardSubtab(tab.id)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.subtabText,
                activeSubtab === tab.id && styles.subtabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Delete Feedback Toast */}
      {deleteNotice && (
        <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626', textAlign: 'center' }}>
            {deleteNotice}
          </Text>
        </View>
      )}

      {/* Loading state */}
      {loading && trips.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#A83827" />
          <Text style={{ fontSize: 12, color: THEME.textSecondary, marginTop: 10 }}>
            Fetching trips from TripSaathi MongoDB...
          </Text>
        </View>
      ) : (
        <View>
          {/* ======================================================== */}
          {/* 1. CURRENT ACTIVE TRIP (AT TOP)                          */}
          {/* ======================================================== */}
          {showCurrent && currentTrips.length > 0 && (
            <View>
              <View style={styles.tripsSectionHeaderRow}>
                <Text style={styles.tripsSectionTitle}>CURRENT JOURNEY • IN PROGRESS</Text>
                <View style={styles.tripsCountBadge}>
                  <Text style={styles.tripsCountBadgeText}>Active (1)</Text>
                </View>
              </View>

              {currentTrips.map((trip) => {
                const totalBudget =
                  trip.total_estimated_budget ||
                  (trip.legs?.reduce((s, l) => s + (l.estimated_budget || 0), 0) || 0) +
                    (trip.stay_plan?.hotel_budget || 0);

                const legsCount =
                  trip.legs_count ||
                  trip.legs?.length ||
                  trip.tickets_count ||
                  trip.tickets?.length ||
                  3;

                const paxCount = trip.people_count || 2;

                return (
                  <View key={trip._id} style={styles.currentTripCard}>
                    {/* Header: Status Badge + Delete Button */}
                    <View style={styles.currentTripHeaderRow}>
                      <View style={styles.currentTripBadge}>
                        <View style={styles.currentTripBadgeDot} />
                        <Text style={styles.currentTripBadgeText}>
                          LIVE DISRUPTION MONITORING
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.tripDeleteBtn}
                        onPress={() => handleDeleteTrip(trip._id, trip.trip_name)}
                        disabled={deletingId === trip._id}
                        activeOpacity={0.8}
                      >
                        {deletingId === trip._id ? (
                          <ActivityIndicator size="small" color="#DC2626" />
                        ) : (
                          <>
                            <Text style={{ fontSize: 11 }}>🗑️</Text>
                            <Text style={styles.tripDeleteBtnText}>Delete</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Trip Title */}
                    <Text style={styles.currentTripTitle}>{trip.trip_name}</Text>

                    {/* Route & Dates */}
                    <View style={styles.currentTripRouteRow}>
                      <Text style={{ fontSize: 14 }}>📍</Text>
                      <Text style={styles.currentTripRouteText}>
                        {trip.route || 'Delhi (DEL) → Mumbai (BOM)'}
                      </Text>
                    </View>

                    <Text style={styles.currentTripDateText}>
                      📅 {trip.start_date || '18 Oct 2026'}{' '}
                      {trip.end_date ? `– ${trip.end_date}` : '• Multi-Modal Itinerary'}
                    </Text>

                    {/* Stats Grid */}
                    <View style={styles.currentTripStatsGrid}>
                      <View style={styles.currentTripStatItem}>
                        <Text style={styles.currentTripStatLabel}>TOTAL BUDGET</Text>
                        <Text style={styles.currentTripStatVal}>
                          ₹{Number(totalBudget || 18050).toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.currentTripStatItem}>
                        <Text style={styles.currentTripStatLabel}>CONNECTIONS</Text>
                        <Text style={styles.currentTripStatVal}>{legsCount} Legs</Text>
                      </View>
                      <View style={styles.currentTripStatItem}>
                        <Text style={styles.currentTripStatLabel}>TRAVELERS</Text>
                        <Text style={styles.currentTripStatVal}>{paxCount} Pax</Text>
                      </View>
                    </View>

                    {/* Live Flight Delay Alert Hero Strip */}
                    <View style={styles.currentTripAlertStrip}>
                      <View style={styles.currentTripAlertTitleRow}>
                        <Text style={{ fontSize: 14 }}>⚠️</Text>
                        <Text style={styles.currentTripAlertTitle}>
                          Flight IndiGo 6E-2041 Delayed +2h 30m
                        </Text>
                      </View>
                      <Text style={styles.currentTripAlertText}>
                        Touchdown pushed to 16:15. Taj Lands End check-in hold activated until 23:59.
                      </Text>
                      <TouchableOpacity
                        style={styles.currentTripImpactBtn}
                        onPress={onViewImpact}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.currentTripImpactBtnText}>
                          Inspect Cascading Schedule Impact ›
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Segment Cards List Preview */}
                    <View style={styles.segmentList}>
                      <View style={styles.segmentCard}>
                        <View style={styles.segmentIconBox}>
                          <Text style={styles.segmentEmoji}>🚕</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.segmentName}>Ground Transfer (Cab)</Text>
                          <Text style={styles.segmentDetail}>Residence → DEL Airport T3 • 09:15</Text>
                        </View>
                        <Text style={styles.badgeGreen}>Completed</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.segmentCard, styles.segmentCardAlert]}
                        onPress={onViewImpact}
                        activeOpacity={0.8}
                      >
                        <View style={styles.segmentIconBox}>
                          <Text style={styles.segmentEmoji}>✈️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.segmentName}>IndiGo 6E-2041</Text>
                          <Text style={styles.segmentDetail}>
                            DEL T3 → BOM T2 • Dep 11:30 → Revised 14:00
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.badgeAmber}>Delayed +2h 30m</Text>
                          <Text style={styles.viewImpactHint}>View Impact ›</Text>
                        </View>
                      </TouchableOpacity>

                      <View style={styles.segmentCard}>
                        <View style={styles.segmentIconBox}>
                          <Text style={styles.segmentEmoji}>🏨</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.segmentName}>Taj Lands End (Mumbai)</Text>
                          <Text style={styles.segmentDetail}>
                            Check-in from 15:00 • Late hold guaranteed
                          </Text>
                        </View>
                        <Text style={styles.badgeGreen}>Protected</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ======================================================== */}
          {/* 2. PAST TRIPS (DULL / OVER RECTANGULAR CARDS)           */}
          {/* ======================================================== */}
          {showPast && pastTrips.length > 0 && (
            <View style={{ marginTop: showCurrent && currentTrips.length > 0 ? 10 : 0 }}>
              <View style={styles.tripsSectionHeaderRow}>
                <Text style={styles.tripsSectionTitle}>PAST JOURNEYS (COMPLETED)</Text>
                <View style={styles.tripsCountBadge}>
                  <Text style={styles.tripsCountBadgeText}>{pastTrips.length} Archive</Text>
                </View>
              </View>

              {pastTrips.map((trip) => {
                const totalBudget =
                  trip.total_estimated_budget ||
                  (trip.legs?.reduce((s, l) => s + (l.estimated_budget || 0), 0) || 0) +
                    (trip.stay_plan?.hotel_budget || 0);

                const segmentsCount =
                  trip.legs_count ||
                  trip.legs?.length ||
                  trip.tickets_count ||
                  trip.tickets?.length ||
                  2;

                return (
                  <View key={trip._id} style={styles.pastTripCard}>
                    {/* Header Row: Dull Badge + Delete Button */}
                    <View style={styles.pastTripHeaderRow}>
                      <View style={styles.pastTripBadge}>
                        <Text style={{ fontSize: 9 }}>✓</Text>
                        <Text style={styles.pastTripBadgeText}>COMPLETED • OVER</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.pastTripDeleteBtn}
                        onPress={() => handleDeleteTrip(trip._id, trip.trip_name)}
                        disabled={deletingId === trip._id}
                        activeOpacity={0.8}
                      >
                        {deletingId === trip._id ? (
                          <ActivityIndicator size="small" color="#8A7E72" />
                        ) : (
                          <>
                            <Text style={{ fontSize: 10 }}>🗑️</Text>
                            <Text style={styles.pastTripDeleteBtnText}>Delete</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Title in dull styling */}
                    <Text style={styles.pastTripTitle}>{trip.trip_name}</Text>

                    {/* Route & Dates */}
                    <View style={styles.pastTripRouteRow}>
                      <Text style={styles.pastTripRouteText}>
                        📍 {trip.route || `${trip.from_location || 'Origin'} → ${trip.to_location || 'Destination'}`}
                      </Text>
                      <Text style={styles.pastTripDateText}>
                        📅 {trip.start_date} {trip.end_date ? `– ${trip.end_date}` : ''}
                      </Text>
                    </View>

                    {/* Meta Row: Budget & Segments */}
                    <View style={styles.pastTripMetaRow}>
                      <Text style={styles.pastTripMetaItem}>
                        💰 ₹{Number(totalBudget || 0).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.pastTripMetaItem}>
                        🔗 {segmentsCount} Segments
                      </Text>
                      <Text style={styles.pastTripMetaItem}>
                        👥 {trip.people_count || 1} Pax
                      </Text>
                    </View>

                    {/* Notes */}
                    {trip.notes && (
                      <Text style={styles.pastTripNotes}>
                        Note: {trip.notes}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Empty state if all trips are deleted */}
          {trips.length === 0 && !loading && (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#FAF7F2', borderRadius: 12, borderWidth: 1, borderColor: '#EAE3D7', marginVertical: 16 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🗺️</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: THEME.text }}>
                No Trips Found in Database
              </Text>
              <Text style={{ fontSize: 12, color: THEME.textSecondary, textAlign: 'center', marginVertical: 8, lineHeight: 18 }}>
                You have deleted all trips or haven't planned one yet. Plan a new multi-leg journey or register existing booked tickets.
              </Text>
              <TouchableOpacity
                style={[styles.primaryTerracottaBtn, { marginTop: 8 }]}
                onPress={onNavigateToAddTrip}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryTerracottaBtnText}>+ Plan or Add New Trip</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

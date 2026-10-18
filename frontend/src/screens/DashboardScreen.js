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

const APP_FEATURES = [
  'Autonomous Flight Delay Monitoring',
  'Automatic Hotel Check-in Hold',
  'Multi-Modal Route Planning',
  'Zero-Loss Travel Recovery',
  'AI Ticket PDF Scanner',
  'Real-Time Cascading Impact Analysis',
];

export default function DashboardScreen({
  token,
  user,
  dashboardSubtab = 'All Trips',
  setDashboardSubtab,
  onViewImpact,
  onNavigateToAddTrip,
  onOpenProfile,
}) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteNotice, setDeleteNotice] = useState(null);

  const fetchTripsFromDb = async (isManualRefresh = false) => {
    if (!token || !user) {
      setTrips([]);
      return;
    }

    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await tripApi.getMyTrips(token);
      const data = await res.json();
      if (res.ok && data.trips) {
        setTrips(data.trips);
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.warn('Error fetching trips from MongoDB:', err);
      setTrips([]);
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

  // ========================================================
  // VIEW FOR NON-SIGNED IN USERS: Bulleted Features of App
  // (Each feature max 5 words, max 6 features)
  // ========================================================
  if (!user) {
    return (
      <View style={styles.activeScreenBox}>
        {/* Title */}
        <View style={styles.screenTitleRow}>
          <View>
            <Text style={styles.screenTitleSerif}>TripSaathi</Text>
            <Text style={styles.impactSubText}>
              Autonomous connected travel intelligence & recovery
            </Text>
          </View>
        </View>

        {/* Bulleted Features Card */}
        <View style={styles.welcomeFeaturesCard}>
          <View style={styles.welcomeFeaturesHeader}>
            <Text style={styles.welcomeFeaturesTitle}>Core Capabilities</Text>
          </View>

          <View style={styles.welcomeFeatureList}>
            {APP_FEATURES.map((feature, idx) => (
              <View key={`feat-${idx}`} style={styles.welcomeFeatureItem}>
                <View style={styles.welcomeFeatureDot} />
                <Text style={styles.welcomeFeatureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Sign In Prompt */}
          <View style={{ backgroundColor: '#FAF7F2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EAE3D7', marginTop: 4 }}>
            <Text style={{ fontSize: 11, color: THEME.textSecondary, textAlign: 'center', lineHeight: 16 }}>
              💡 Sign in with your Google account in the top bar to plan journeys, track bookings, and view your trip archive.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ========================================================
  // VIEW FOR SIGNED IN USERS: Trips from Database
  // ========================================================
  const activeSubtab = dashboardSubtab || 'All Trips';
  const showCurrent = activeSubtab === 'All Trips' || activeSubtab === 'Active';
  const showPast = activeSubtab === 'All Trips' || activeSubtab === 'Past';

  return (
    <View style={styles.activeScreenBox}>
      {/* Title */}
      <View style={styles.screenTitleRow}>
        <View>
          <Text style={styles.screenTitleSerif}>Trip Dashboard</Text>
          <Text style={styles.impactSubText}>
            Connected itineraries & historical journeys
          </Text>
        </View>
      </View>

      {/* Database Sync & User Indicator Strip */}
      <View style={styles.dashboardDbSyncRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 13 }}>👤</Text>
          <Text style={styles.dashboardUserEmailText}>{user.email}</Text>
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

      {/* Subtabs Filter: All | Active | Past */}
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
          {/* 1. CURRENT ACTIVE TRIP (If any; no active yet)           */}
          {/* ======================================================== */}
          {showCurrent && (
            <View>
              <View style={styles.tripsSectionHeaderRow}>
                <Text style={styles.tripsSectionTitle}>CURRENT JOURNEY • IN PROGRESS</Text>
                <View style={styles.tripsCountBadge}>
                  <Text style={styles.tripsCountBadgeText}>{currentTrips.length} Active</Text>
                </View>
              </View>

              {currentTrips.length === 0 ? (
                /* No active trip yet */
                <View style={styles.noActiveTripBanner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noActiveTripTitle}>No active trip yet</Text>
                    <Text style={styles.noActiveTripSub}>
                      Plan a multi-leg journey or register tickets to start live monitoring.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.primaryTerracottaBtn, { paddingVertical: 8, paddingHorizontal: 12 }]}
                    onPress={onNavigateToAddTrip}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.primaryTerracottaBtnText, { fontSize: 11 }]}>+ Plan Trip</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                currentTrips.map((trip) => {
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

                  return (
                    <View key={trip._id} style={styles.currentTripCard}>
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

                      <Text style={styles.currentTripTitle}>{trip.trip_name}</Text>
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

                      <View style={styles.currentTripStatsGrid}>
                        <View style={styles.currentTripStatItem}>
                          <Text style={styles.currentTripStatLabel}>TOTAL BUDGET</Text>
                          <Text style={styles.currentTripStatVal}>
                            ₹{Number(totalBudget || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.currentTripStatItem}>
                          <Text style={styles.currentTripStatLabel}>CONNECTIONS</Text>
                          <Text style={styles.currentTripStatVal}>{legsCount} Legs</Text>
                        </View>
                        <View style={styles.currentTripStatItem}>
                          <Text style={styles.currentTripStatLabel}>TRAVELERS</Text>
                          <Text style={styles.currentTripStatVal}>{trip.people_count || 2} Pax</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ======================================================== */}
          {/* 2. PAST TRIPS (DULL RECTANGULAR CARDS)                   */}
          {/* ======================================================== */}
          {showPast && pastTrips.length > 0 && (
            <View style={{ marginTop: 10 }}>
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
                You have no saved trips. Plan a new multi-leg journey or register existing booked tickets.
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

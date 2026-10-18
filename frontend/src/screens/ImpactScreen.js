import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/appStyles';

export default function ImpactScreen({
  disruption,
  user,
  onNavigateToRecovery,
  onNavigateToDashboard,
}) {
  const isArneshWithDisruption =
    user?.email?.toLowerCase() === 'arnesh052006@gmail.com' && disruption;

  return (
    <View style={styles.activeScreenBox}>
      {/* Title */}
      <View style={styles.screenTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.screenTitleSerif}>Impact Analysis</Text>
          <View
            style={{
              backgroundColor: isArneshWithDisruption ? '#FBF6EE' : '#ECFDF5',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isArneshWithDisruption ? '#E8DFD1' : '#A7F3D0',
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                color: isArneshWithDisruption ? '#8C3224' : '#047857',
              }}
            >
              {isArneshWithDisruption ? 'ITINERARY ADJUSTMENT' : 'ALL ON SCHEDULE'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.impactSubText}>
        Downstream timeline adjustments for AirIndia SP-952 and StayPulse hotel
      </Text>

      {/* When NO disruption data in DB or user is not arnesh052006@gmail.com */}
      {!isArneshWithDisruption ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No Schedule Impact Detected</Text>
          <Text style={styles.emptyStateDesc}>
            All flight legs and hotel reservations are operating on schedule. Any schedule updates will reflect here.
          </Text>
          <TouchableOpacity
            style={[styles.primaryTerracottaBtn, { paddingVertical: 10, paddingHorizontal: 16 }]}
            onPress={onNavigateToDashboard}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryTerracottaBtnText}>View My Trips</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* When arnesh052006@gmail.com is signed in and has disruption stored in DB */
        <View>
          {/* CASCADING SCHEDULE TIMELINE */}
          <Text style={styles.affectedHeading}>REVISED SCHEDULE TIMELINE</Text>

          <View style={{ backgroundColor: '#FAF7F2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EAE3D7', marginBottom: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#A83827', marginTop: 5 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B18' }}>Flight SP-952 Departure (DEL T5)</Text>
                <Text style={{ fontSize: 11, color: '#68697F', marginTop: 1 }}>Scheduled 17:00 → Revised 19:15</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706', marginTop: 5 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B18' }}>Touchdown & Arrival (BOM T6)</Text>
                <Text style={{ fontSize: 11, color: '#68697F', marginTop: 1 }}>Revised 01:15 • Luggage retrieval: 01:40</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#64748B', marginTop: 5 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B18' }}>Airport Chauffeur Transfer</Text>
                <Text style={{ fontSize: 11, color: '#68697F', marginTop: 1 }}>Pickup re-timed to 01:45 at Terminal 6</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669', marginTop: 5 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B18' }}>StayPulse Room Check-in</Text>
                <Text style={{ fontSize: 11, color: '#68697F', marginTop: 1 }}>Expected 02:00 • Covered under late hold policy</Text>
              </View>
            </View>
          </View>

          {/* CONNECTED RESERVATION STATUS */}
          <Text style={styles.affectedHeading}>CONNECTED RESERVATIONS</Text>

          {/* Hotel Impact */}
          <View style={[styles.impactItemCard, { backgroundColor: '#FAF7F2', borderColor: '#EAE3D7' }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.impactItemTitle}>StayPulse Deluxe Airport View Room</Text>
              <Text style={styles.impactItemSub}>
                Check-in revised to 02:00. Room held past midnight with zero cancellation penalty.
              </Text>
            </View>
            <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#FCD34D' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>Hold Protected</Text>
            </View>
          </View>

          {/* AirIndia Flight Impact */}
          <View style={[styles.impactItemCard, { backgroundColor: '#FAF7F2', borderColor: '#EAE3D7' }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.impactItemTitle}>AirIndia SP-952 (DEL → BOM)</Text>
              <Text style={styles.impactItemSub}>
                Airspace delay +2h 15m. Departure at 19:15 with confirmed non-stop routing.
              </Text>
            </View>
            <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569' }}>Revised 19:15</Text>
            </View>
          </View>

          {/* Transit Transfer */}
          <View style={[styles.impactItemCard, { backgroundColor: '#FAF7F2', borderColor: '#EAE3D7' }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.impactItemTitle}>Pre-Booked Airport Chauffeur</Text>
              <Text style={styles.impactItemSub}>
                Pickup window rescheduled to 01:45 to match Terminal 6 arrival.
              </Text>
            </View>
            <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#A7F3D0' }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#047857' }}>Synchronized</Text>
            </View>
          </View>

          {/* PRIMARY ACTION BUTTON */}
          <TouchableOpacity
            style={styles.primaryTerracottaBtn}
            onPress={onNavigateToRecovery}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryTerracottaBtnText}>
              Review Policy Protection & Actions ›
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

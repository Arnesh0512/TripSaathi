import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/appStyles';

export default function ImpactScreen({ onNavigateToRecovery }) {
  return (
    <View style={styles.activeScreenBox}>
      {/* Title */}
      <View style={styles.screenTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.screenTitleSerif}>Impact Analysis</Text>
          <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5' }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#DC2626' }}>ACTIVE DISRUPTION</Text>
          </View>
        </View>
        <Text style={styles.screenStepBadge}>STAGE 03</Text>
      </View>
      <Text style={styles.impactSubText}>
        Downstream chain reaction & schedule lag across multi-leg itinerary
      </Text>

      {/* 1. HERO DELAY & SCHEDULE LAG CARD */}
      <View style={styles.delayHeroCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={styles.delayHeroKicker}>FLIGHT DELAY DETECTED</Text>
            <Text style={styles.delayHeroTime}>+2h 30m</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#DC2626' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626' }}>150 MIN LAG</Text>
          </View>
        </View>
        <Text style={styles.delayHeroLocation}>
          IndiGo 6E-2041 (DEL → BOM): Touchdown at Mumbai Airport pushed from 13:45 to 16:15.
        </Text>
      </View>

      {/* 2. CASCADING SCHEDULE TIMELINE */}
      <Text style={styles.affectedHeading}>CASCADING SCHEDULE IMPACT</Text>

      <View style={{ backgroundColor: '#FAF7F2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EAE3D7', marginBottom: 14, gap: 10 }}>
        {/* Step 1 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Text style={{ fontSize: 16 }}>🛫</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B18' }}>Flight Departure (DEL)</Text>
            <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '600' }}>
              Original 11:30 → Revised 14:00 (+2h 30m delay)
            </Text>
          </View>
        </View>

        {/* Step 2 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Text style={{ fontSize: 16 }}>🛬</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B18' }}>Mumbai Airport Landing (BOM T2)</Text>
            <Text style={{ fontSize: 11, color: '#68697F' }}>
              Delayed touchdown at 16:15 • Luggage retrieval: ~16:45
            </Text>
          </View>
        </View>

        {/* Step 3 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Text style={{ fontSize: 16 }}>🚕</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B18' }}>BOM Airport Transfer to Bandstand</Text>
            <Text style={{ fontSize: 11, color: '#B45309', fontWeight: '600' }}>
              Cab window missed by 2h 30m • Mumbai evening peak traffic (~60 mins)
            </Text>
          </View>
        </View>

        {/* Step 4 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Text style={{ fontSize: 16 }}>🏨</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#DC2626' }}>Hotel Taj Lands End Check-In</Text>
            <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '700' }}>
              Estimated Hotel Arrival: 17:45 – 18:00 (Standard cut-off is 18:00!)
            </Text>
          </View>
        </View>
      </View>

      {/* 3. DETAILED RISK ASSESSMENT */}
      <Text style={styles.affectedHeading}>WHAT IS IN RISK?</Text>

      {/* Hotel Risk */}
      <View style={[styles.impactItemCard, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#DC2626' }}>
              🏨 Hotel Reservation at Taj Lands End
            </Text>
          </View>
          <Text style={{ fontSize: 11, color: '#7F1D1D', lineHeight: 16 }}>
            StayPulse policy stipulates standard unnotified check-in expires at 18:00. Arriving at 17:50 gives only a 10-minute buffer before the room risks being reassigned to waitlisted travelers.
          </Text>
        </View>
        <Text style={[styles.badgeAmber, { backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#F87171' }]}>
          High Risk
        </Text>
      </View>

      {/* Transit Transfer Risk */}
      <View style={styles.impactItemCard}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.impactItemTitle}>🚗 Pre-Booked Airport Chauffeur</Text>
          <Text style={styles.impactItemSub}>
            Airport cab pickup window (14:00) exceeded. Driver will incur waiting fees or cancel unless re-timed.
          </Text>
        </View>
        <Text style={styles.badgeAmber}>Medium Risk</Text>
      </View>

      {/* 4. PRIMARY ACTION BUTTON */}
      <TouchableOpacity
        style={styles.primaryTerracottaBtn}
        onPress={onNavigateToRecovery}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryTerracottaBtnText}>
          ⚡ Proceed to Automated Recovery & Policies ›
        </Text>
      </TouchableOpacity>
    </View>
  );
}

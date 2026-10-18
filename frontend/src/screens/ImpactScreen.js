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
              backgroundColor: isArneshWithDisruption ? '#FEF2F2' : '#ECFDF5',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isArneshWithDisruption ? '#FCA5A5' : '#A7F3D0',
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                color: isArneshWithDisruption ? '#DC2626' : '#047857',
              }}
            >
              {isArneshWithDisruption ? 'ACTIVE DISRUPTION' : 'ALL ON SCHEDULE'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.impactSubText}>
        Downstream chain reaction & schedule lag across multi-leg itinerary
      </Text>

      {/* When NO disruption data in DB or user is not arnesh052006@gmail.com */}
      {!isArneshWithDisruption ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateIcon}>🛡️</Text>
          <Text style={styles.emptyStateTitle}>No Schedule Impact Detected</Text>
          <Text style={styles.emptyStateDesc}>
            All flights, trains, and hotel check-in cut-offs are operating on schedule. If any delay is detected by TinyFish radar, downstream cascading impacts will appear here immediately.
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
          {/* 1. HERO DELAY & SCHEDULE LAG CARD */}
          <View style={styles.delayHeroCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.delayHeroKicker}>FLIGHT DELAY DETECTED</Text>
                <Text style={styles.delayHeroTime}>{disruption.delay_time || '+2h 30m'}</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#DC2626' }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626' }}>
                  {disruption.lag_minutes || '150 MIN LAG'}
                </Text>
              </View>
            </View>
            <Text style={styles.delayHeroLocation}>
              {disruption.hero_description ||
                'IndiGo 6E-2041 (DEL → BOM): Touchdown at Mumbai Airport pushed from 13:45 to 16:15.'}
            </Text>
          </View>

          {/* 2. CASCADING SCHEDULE TIMELINE FROM DB */}
          <Text style={styles.affectedHeading}>CASCADING SCHEDULE IMPACT</Text>

          <View style={{ backgroundColor: '#FAF7F2', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EAE3D7', marginBottom: 14, gap: 10 }}>
            {disruption.cascading_steps?.map((step, idx) => (
              <View key={`step-${idx}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Text style={{ fontSize: 16 }}>{step.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B18' }}>{step.title}</Text>
                  <Text style={{ fontSize: 11, color: step.is_alert ? '#DC2626' : '#68697F', fontWeight: step.is_alert ? '600' : '400' }}>
                    {step.desc}
                  </Text>
                </View>
              </View>
            ))}
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
                StayPulse policy stipulates standard unnotified check-in expires at 18:00. Arriving at 17:45 gives only a 15-minute buffer before the room risks being reassigned to waitlisted travelers.
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
                Airport cab pickup window (14:30) exceeded. Chauffeur pickup must be synchronized with revised BOM arrival.
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
      )}
    </View>
  );
}

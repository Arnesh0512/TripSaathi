import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { styles } from '../styles/appStyles';

export default function MonitorScreen({ onViewImpact, onNavigateToAddTrip, onTriggerDelayAlert, isDelayAlertActive = true }) {
  const [checking, setChecking] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState('Just now');
  const [activeCadenceTier, setActiveCadenceTier] = useState('IMMINENT'); // 'RELAXED' | 'HOURLY' | 'IMMINENT'
  const [secondsToNextPing, setSecondsToNextPing] = useState(180);

  // Countdown timer for next ping
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsToNextPing((prev) => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleManualCheck = async () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setLastCheckedTime('Just now');
      setSecondsToNextPing(300);
      if (onTriggerDelayAlert) onTriggerDelayAlert(true);
    }, 1800);
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.activeScreenBox}>
      {/* Screen Title */}
      <View style={styles.screenTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.screenTitleSerif}>Booking Monitor</Text>
          <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#0369A1' }}>TINYFISH AGENT</Text>
          </View>
        </View>
        <Text style={styles.screenStepBadge}>RADAR</Text>
      </View>
      <Text style={styles.impactSubText}>
        Autonomous web verification across registered airline & hotel websites
      </Text>

      {/* 1. EXPONENTIAL DECAY MONITORING SCALE CARD */}
      <View style={styles.monitorCadenceCard}>
        <View style={styles.monitorCadenceBadge}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#38BDF8' }} />
          <Text style={styles.monitorCadenceBadgeText}>ADAPTIVE EXPONENTIAL SCALE</Text>
        </View>

        <Text style={styles.monitorCadenceTitle}>T − 2 Hours to Departure</Text>
        <Text style={styles.monitorCadenceDesc}>
          TinyFish increases verification frequency as departure draws nearer. Long-range checks run every 2–3 hrs; day-of travel runs every 5 minutes.
        </Text>

        {/* 3-Tier Decay Visualization */}
        <View style={styles.cadenceTiersGrid}>
          <TouchableOpacity
            style={[styles.cadenceTierItem, activeCadenceTier === 'RELAXED' && styles.cadenceTierActive]}
            onPress={() => setActiveCadenceTier('RELAXED')}
            activeOpacity={0.8}
          >
            <Text style={styles.cadenceTierLabel}>T &gt; 5 Days</Text>
            <Text style={styles.cadenceTierFreq}>Every 3h</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cadenceTierItem, activeCadenceTier === 'HOURLY' && styles.cadenceTierActive]}
            onPress={() => setActiveCadenceTier('HOURLY')}
            activeOpacity={0.8}
          >
            <Text style={styles.cadenceTierLabel}>T − 24h</Text>
            <Text style={styles.cadenceTierFreq}>Every 30m</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.cadenceTierItem, activeCadenceTier === 'IMMINENT' && styles.cadenceTierActive]}
            onPress={() => setActiveCadenceTier('IMMINENT')}
            activeOpacity={0.8}
          >
            <Text style={styles.cadenceTierLabel}>T &lt; 2h (Now)</Text>
            <Text style={styles.cadenceTierFreq}>Every 5m</Text>
          </TouchableOpacity>
        </View>

        {/* Ping Button & Live Countdown */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 11, color: '#94A3B8' }}>
            Next ping in <Text style={{ color: '#38BDF8', fontWeight: '800' }}>{formatCountdown(secondsToNextPing)}</Text> • Last: {lastCheckedTime}
          </Text>
          <TouchableOpacity
            style={styles.monitorPingBtn}
            onPress={handleManualCheck}
            disabled={checking}
            activeOpacity={0.8}
          >
            {checking ? (
              <ActivityIndicator color="#fff" size="small" style={{ paddingHorizontal: 12 }} />
            ) : (
              <Text style={styles.monitorPingBtnText}>⚡ Check Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. CASCADING DELAY ALERT HERO BANNER (When flight delay detected) */}
      {isDelayAlertActive && (
        <View style={styles.monitorAlertHero}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={styles.monitorAlertHeroTitle}>Flight Delay Detected: +2h 30m</Text>
          </View>
          <Text style={styles.monitorAlertHeroText}>
            IndiGo 6E-2041 departure from DEL pushed to 14:00 (due to airspace congestion). Arrival at BOM delayed to 16:15. This threatens your evening check-in at Taj Lands End Mumbai!
          </Text>
          <TouchableOpacity
            style={styles.monitorAlertHeroBtn}
            onPress={onViewImpact}
            activeOpacity={0.85}
          >
            <Text style={styles.monitorAlertHeroBtnText}>
              Inspect Cascading Impact on Schedule ›
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. MONITORED BOOKINGS CARDS */}
      <Text style={{ fontSize: 11, fontWeight: '800', color: '#68697F', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
        ACTIVE MONITORED BOOKINGS
      </Text>

      {/* Flight Booking */}
      <View style={styles.monitorBookingCard}>
        <View style={styles.monitorBookingHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>✈️</Text>
            <View>
              <Text style={styles.monitorBookingTitle}>IndiGo 6E-2041 (DEL → BOM)</Text>
              <Text style={{ fontSize: 10, color: '#786C5E' }}>Portal: demo-arilines.vercel.app</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#DC2626' }}>DELAYED +2h 30m</Text>
          </View>
        </View>

        <View style={styles.monitorDetailRow}>
          <Text style={styles.monitorDetailLabel}>PNR / Flight ID:</Text>
          <Text style={styles.monitorDetailVal}>6E-2041 • PNR-DEL-882</Text>
        </View>
        <View style={styles.monitorDetailRow}>
          <Text style={styles.monitorDetailLabel}>Scheduled Departure:</Text>
          <Text style={styles.monitorDetailVal}>11:30 → Revised 14:00</Text>
        </View>
        <View style={styles.monitorDetailRow}>
          <Text style={styles.monitorDetailLabel}>TinyFish Radar Check:</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#0284C7' }}>Scraped 1m ago • Delay Verified</Text>
        </View>
      </View>

      {/* Hotel Reservation */}
      <View style={styles.monitorBookingCard}>
        <View style={styles.monitorBookingHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 18 }}>🏨</Text>
            <View>
              <Text style={styles.monitorBookingTitle}>Taj Lands End (Bandstand, Mumbai)</Text>
              <Text style={{ fontSize: 10, color: '#786C5E' }}>Portal: stay-pulse.vercel.app</Text>
            </View>
          </View>
          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#FCD34D' }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#B45309' }}>AT RISK (LATE ARRIVAL)</Text>
          </View>
        </View>

        <View style={styles.monitorDetailRow}>
          <Text style={styles.monitorDetailLabel}>Booking ID:</Text>
          <Text style={styles.monitorDetailVal}>RES-TL-84920 (Deluxe Room)</Text>
        </View>
        <View style={styles.monitorDetailRow}>
          <Text style={styles.monitorDetailLabel}>Standard Check-in Slot:</Text>
          <Text style={styles.monitorDetailVal}>14:00–16:00 (Cut-off 18:00)</Text>
        </View>
        <View style={styles.monitorDetailRow}>
          <Text style={styles.monitorDetailLabel}>Est. Arrival with Delay:</Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>17:45 (Only 15m buffer!)</Text>
        </View>
        <View style={styles.monitorDetailRow}>
          <Text style={styles.monitorDetailLabel}>TinyFish Radar Check:</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: '#0284C7' }}>Scraped 3m ago • Room Held</Text>
        </View>
      </View>

      {/* Scope Footer */}
      <View style={styles.scopeNoteBox}>
        <Text style={styles.scopeNoteTitle}>AUTONOMOUS RADAR SCOPE</Text>
        <Text style={styles.scopeNoteBody}>
          TinyFish runs headless browser workers to check PNRs and booking codes without spamming airline servers. Adaptive exponential decay keeps API usage lean while ensuring zero surprise delays.
        </Text>
      </View>
    </View>
  );
}

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from '../styles/appStyles';

export default function MonitorScreen({
  disruption,
  user,
  onViewImpact,
  onNavigateToAddTrip,
  onTriggerDelayAlert,
}) {
  const [checking, setChecking] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState('Just now');
  const [activeCadenceTier, setActiveCadenceTier] = useState(
    disruption?.active_cadence_tier || 'IMMINENT'
  );
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

  const isArneshWithDisruption =
    user?.email?.toLowerCase() === 'arnesh052006@gmail.com' && disruption;

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

      {/* When NO disruption data in DB or user is not arnesh052006@gmail.com */}
      {!isArneshWithDisruption ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateIcon}>📡</Text>
          <Text style={styles.emptyStateTitle}>No Active Bookings Under Radar</Text>
          <Text style={styles.emptyStateDesc}>
            There are currently no live flight or hotel bookings being checked. Register confirmed tickets or plan a multi-leg journey to enable autonomous radar.
          </Text>
          <TouchableOpacity
            style={[styles.primaryTerracottaBtn, { paddingVertical: 10, paddingHorizontal: 16 }]}
            onPress={onNavigateToAddTrip}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryTerracottaBtnText}>+ Add Trip or Register Tickets</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* When arnesh052006@gmail.com is signed in and has disruption stored in DB */
        <View>
          {/* 1. EXPONENTIAL DECAY MONITORING SCALE CARD */}
          <View style={styles.monitorCadenceCard}>
            <View style={styles.monitorCadenceBadge}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#38BDF8' }} />
              <Text style={styles.monitorCadenceBadgeText}>ADAPTIVE EXPONENTIAL SCALE</Text>
            </View>

            <Text style={styles.monitorCadenceTitle}>
              {disruption.cadence_title || 'T − 2 Hours to Departure'}
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
                  <Text style={styles.monitorPingBtnText}>Check Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. CASCADING DELAY ALERT HERO BANNER */}
          {disruption.has_delay && (
            <View style={styles.monitorAlertHero}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>⚠️</Text>
                <Text style={styles.monitorAlertHeroTitle}>
                  {disruption.delay_text || 'Flight Delay Detected: +2h 30m'}
                </Text>
              </View>
              <Text style={styles.monitorAlertHeroText}>
                {disruption.delay_detail ||
                  'IndiGo 6E-2041 departure from DEL pushed to 14:00. This threatens your check-in at Taj Lands End!'}
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

          {/* 3. MONITORED BOOKINGS CARDS FROM DB */}
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#68697F', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
            ACTIVE MONITORED BOOKINGS ({disruption.bookings?.length || 0})
          </Text>

          {disruption.bookings?.map((b) => (
            <View key={b.id} style={styles.monitorBookingCard}>
              <View style={styles.monitorBookingHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>{b.icon || '✈️'}</Text>
                  <View>
                    <Text style={styles.monitorBookingTitle}>{b.title}</Text>
                    <Text style={{ fontSize: 10, color: '#786C5E' }}>Portal: {b.portal}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: b.status_badge.includes('DELAY') ? '#FEF2F2' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: b.status_badge.includes('DELAY') ? '#FCA5A5' : '#FCD34D' }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: b.status_badge.includes('DELAY') ? '#DC2626' : '#B45309' }}>
                    {b.status_badge}
                  </Text>
                </View>
              </View>

              <View style={styles.monitorDetailRow}>
                <Text style={styles.monitorDetailLabel}>Booking / PNR ID:</Text>
                <Text style={styles.monitorDetailVal}>{b.pnr}</Text>
              </View>
              <View style={styles.monitorDetailRow}>
                <Text style={styles.monitorDetailLabel}>Scheduled Time:</Text>
                <Text style={styles.monitorDetailVal}>{b.schedule}</Text>
              </View>
              {b.est_arrival && (
                <View style={styles.monitorDetailRow}>
                  <Text style={styles.monitorDetailLabel}>Est. Arrival with Delay:</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>{b.est_arrival}</Text>
                </View>
              )}
              <View style={styles.monitorDetailRow}>
                <Text style={styles.monitorDetailLabel}>TinyFish Radar Check:</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#0284C7' }}>{b.last_check}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

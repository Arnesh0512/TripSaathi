import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/appStyles';

export default function DashboardScreen({
  dashboardSubtab,
  setDashboardSubtab,
  onViewImpact,
}) {
  return (
    <View style={styles.activeScreenBox}>
      <View style={styles.screenTitleRow}>
        <Text style={styles.screenTitleSerif}>Trip Dashboard</Text>
        <Text style={styles.screenStepBadge}>STAGE 02</Text>
      </View>

      {/* Subtabs: Overview | Updates | Alerts */}
      <View style={styles.subtabsRow}>
        {['Overview', 'Updates', 'Alerts'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.subtabBtn, dashboardSubtab === tab && styles.subtabBtnActive]}
            onPress={() => setDashboardSubtab(tab)}
          >
            <Text
              style={[
                styles.subtabText,
                dashboardSubtab === tab && styles.subtabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Route Header */}
      <View style={styles.routeBox}>
        <Text style={styles.routeTitle}>Delhi → Mumbai</Text>
        <Text style={styles.routeDateText}>24 May 2025 • Multi-Modal Journey</Text>
      </View>

      {/* Journey Segments List */}
      <View style={styles.segmentList}>
        <View style={styles.segmentCard}>
          <View style={styles.segmentIconBox}>
            <Text style={styles.segmentEmoji}>✈️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.segmentName}>Flight AI-804</Text>
            <Text style={styles.segmentDetail}>Indira Gandhi T3 → BOM T2</Text>
          </View>
          <Text style={styles.badgeGreen}>On Time</Text>
        </View>

        <TouchableOpacity
          style={[styles.segmentCard, styles.segmentCardAlert]}
          onPress={onViewImpact}
          activeOpacity={0.8}
        >
          <View style={styles.segmentIconBox}>
            <Text style={styles.segmentEmoji}>🚆</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.segmentName}>Rail Connection</Text>
            <Text style={styles.segmentDetail}>ID: 146aved • Dep 14:10</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.badgeAmber}>At Risk</Text>
            <Text style={styles.viewImpactHint}>View Impact ›</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.segmentCard}>
          <View style={styles.segmentIconBox}>
            <Text style={styles.segmentEmoji}>🏨</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.segmentName}>Hotel Taj Lands End</Text>
            <Text style={styles.segmentDetail}>Check-in: 15:00 onwards</Text>
          </View>
          <Text style={styles.badgeGreen}>Confirmed</Text>
        </View>

        <View style={styles.segmentCard}>
          <View style={styles.segmentIconBox}>
            <Text style={styles.segmentEmoji}>🚗</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.segmentName}>Ground Transfer</Text>
            <Text style={styles.segmentDetail}>Chauffeur pickup at BOM</Text>
          </View>
          <Text style={styles.badgeMuted}>Scheduled</Text>
        </View>
      </View>
    </View>
  );
}

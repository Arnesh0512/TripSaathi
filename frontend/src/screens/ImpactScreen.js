import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/appStyles';

export default function ImpactScreen({ onNavigateToRecovery }) {
  return (
    <View style={styles.activeScreenBox}>
      <View style={styles.screenTitleRow}>
        <Text style={styles.screenTitleSerif}>Impact View</Text>
        <Text style={styles.screenStepBadge}>STAGE 03</Text>
      </View>
      <Text style={styles.impactSubText}>Downstream chain reaction analysis</Text>

      {/* Hero Delay Card */}
      <View style={styles.delayHeroCard}>
        <Text style={styles.delayHeroKicker}>LIKELY DELAY</Text>
        <Text style={styles.delayHeroTime}>2h 30m</Text>
        <Text style={styles.delayHeroLocation}>Arrival in Mumbai pushed from 18:00 to 20:30</Text>
      </View>

      <Text style={styles.affectedHeading}>AFFECTED DOWNSTREAM BOOKINGS</Text>

      <View style={styles.impactItemCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.impactItemTitle}>Hotel Check-in Window</Text>
          <Text style={styles.impactItemSub}>Standard cut-off is 20:00 without notice</Text>
        </View>
        <Text style={styles.badgeAmber}>At Risk</Text>
      </View>

      <View style={styles.impactItemCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.impactItemTitle}>Evening Dinner Activity</Text>
          <Text style={styles.impactItemSub}>Reserved 20:00 table at Marine Drive</Text>
        </View>
        <Text style={styles.badgeAmber}>At Risk</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryTerracottaBtn}
        onPress={onNavigateToRecovery}
      >
        <Text style={styles.primaryTerracottaBtnText}>View AI Recovery Plans ›</Text>
      </TouchableOpacity>
    </View>
  );
}

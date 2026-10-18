import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/appStyles';

export default function TrackerScreen() {
  return (
    <View style={styles.activeScreenBox}>
      <View style={styles.screenTitleRow}>
        <Text style={styles.screenTitleSerif}>Action Tracker</Text>
        <Text style={styles.screenStepBadge}>STAGE 05</Text>
      </View>
      <Text style={styles.impactSubText}>Stay on top of what matters</Text>

      <View style={styles.trackerGroup}>
        <Text style={styles.trackerGroupHeading}>TO DO</Text>
        <View style={styles.trackerItemRow}>
          <Text style={styles.trackerBullet}>○</Text>
          <Text style={styles.trackerItemText}>Contact hotel desk for late arrival confirmation</Text>
        </View>
        <View style={styles.trackerItemRow}>
          <Text style={styles.trackerBullet}>○</Text>
          <Text style={styles.trackerItemText}>Request late check-in hold</Text>
        </View>
      </View>

      <View style={styles.trackerGroup}>
        <Text style={styles.trackerGroupHeading}>IN PROGRESS</Text>
        <View style={styles.trackerItemRow}>
          <Text style={styles.trackerBulletAmber}>◐</Text>
          <Text style={styles.trackerItemText}>Track AI-804 live flight status</Text>
        </View>
        <View style={styles.trackerItemRow}>
          <Text style={styles.trackerBulletAmber}>◐</Text>
          <Text style={styles.trackerItemText}>Monitor rail connection 146aved updates</Text>
        </View>
      </View>

      <View style={styles.trackerGroup}>
        <Text style={styles.trackerGroupHeading}>COMPLETED</Text>
        <View style={styles.trackerItemRow}>
          <Text style={styles.trackerBulletDone}>✓</Text>
          <Text style={[styles.trackerItemText, styles.trackerItemDone]}>Trip created & itinerary synced</Text>
        </View>
        <View style={styles.trackerItemRow}>
          <Text style={styles.trackerBulletDone}>✓</Text>
          <Text style={[styles.trackerItemText, styles.trackerItemDone]}>Hotel Taj reservation confirmed</Text>
        </View>
      </View>

      {/* Scope boundary footer note */}
      <View style={styles.scopeNoteBox}>
        <Text style={styles.scopeNoteTitle}>SCOPE NOTE</Text>
        <Text style={styles.scopeNoteBody}>
          Actions requiring external portal logins use guided handoffs. Flight & rail data monitored via authorized endpoints.
        </Text>
      </View>
    </View>
  );
}

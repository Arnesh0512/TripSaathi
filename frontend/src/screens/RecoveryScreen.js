import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/appStyles';

export default function RecoveryScreen({ onSelectRecoveryAction }) {
  return (
    <View style={styles.activeScreenBox}>
      <View style={styles.screenTitleRow}>
        <Text style={styles.screenTitleSerif}>Recovery Plans</Text>
        <Text style={styles.screenStepBadge}>STAGE 04</Text>
      </View>
      <Text style={styles.impactSubText}>Deterministic rules-validated options</Text>

      {/* Option 1: Recommended */}
      <View style={styles.recoveryOptionCard}>
        <View style={styles.recoveryOptionHeader}>
          <Text style={styles.recoveryOptionBadge}>OPTION 01 • RECOMMENDED</Text>
          <Text style={styles.badgeGreen}>Low Impact</Text>
        </View>
        <Text style={styles.recoveryOptionTitle}>Hold hotel check-in</Text>
        <Text style={styles.recoveryOptionDesc}>
          Auto-sends verified late arrival notice to hotel desk. Keeps original booking and incurs zero extra charges.
        </Text>
        <View style={styles.recoveryOptionFooter}>
          <Text style={styles.recoveryTimeText}>Expected response: 2:00 PM</Text>
          <TouchableOpacity
            style={styles.approveActionBtn}
            onPress={onSelectRecoveryAction}
          >
            <Text style={styles.approveActionBtnText}>Approve Action</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Option 2 */}
      <View style={styles.recoveryOptionCard}>
        <View style={styles.recoveryOptionHeader}>
          <Text style={styles.recoveryOptionBadge}>OPTION 02</Text>
          <Text style={styles.badgeAmber}>Medium Impact</Text>
        </View>
        <Text style={styles.recoveryOptionTitle}>Alternative Evening Activity</Text>
        <Text style={styles.recoveryOptionDesc}>
          Reschedule dinner reservation to 21:30 or move activity to next morning.
        </Text>
        <View style={styles.recoveryOptionFooter}>
          <Text style={styles.recoveryTimeText}>Reschedule by 6:00 PM</Text>
          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={onSelectRecoveryAction}
          >
            <Text style={styles.outlineActionBtnText}>Select Option</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Option 3 */}
      <View style={styles.recoveryOptionCard}>
        <View style={styles.recoveryOptionHeader}>
          <Text style={styles.recoveryOptionBadge}>OPTION 03</Text>
          <Text style={styles.badgeGreen}>Low Impact</Text>
        </View>
        <Text style={styles.recoveryOptionTitle}>Early check-in request (Next Day)</Text>
        <Text style={styles.recoveryOptionDesc}>
          Request extended late checkout or early luggage storage.
        </Text>
        <View style={styles.recoveryOptionFooter}>
          <Text style={styles.recoveryTimeText}>12:00 PM next day</Text>
          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={onSelectRecoveryAction}
          >
            <Text style={styles.outlineActionBtnText}>Select Option</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

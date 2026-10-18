import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/appStyles';

const TABS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: '🏠' },
  { id: 'ADD_TRIP', label: 'Add Trip', icon: '➕' },
  { id: 'MONITOR', label: 'Monitor', icon: '📡' },
  { id: 'IMPACT', label: 'Impact', icon: '⚠️' },
  { id: 'RECOVERY', label: 'Recovery', icon: '💡' },
];

export default function TabBar({ activeTab, onSelectTab, hasImpactAlert = false }) {
  return (
    <View style={styles.bottomTabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isImpactWithAlert = tab.id === 'IMPACT' && hasImpactAlert;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabBarItem,
              isImpactWithAlert && styles.tabBarItemAlertGlow,
            ]}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
          >
            {isImpactWithAlert && (
              <View style={styles.tabBarAlertBadge}>
                <Text style={styles.tabBarAlertBadgeText}>DELAY</Text>
              </View>
            )}
            <Text style={[styles.tabBarIcon, isActive && styles.tabBarIconActive]}>
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.tabBarLabel,
                isActive && styles.tabBarLabelActive,
                isImpactWithAlert && { color: '#DC2626', fontWeight: '800' },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicatorDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

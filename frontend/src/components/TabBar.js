import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/appStyles';

const TABS = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: '🏠' },
  { id: 'ADD_TRIP', label: 'Add Trip', icon: '➕' },
  { id: 'IMPACT', label: 'Impact', icon: '⚠️' },
  { id: 'RECOVERY', label: 'Recovery', icon: '💡' },
  { id: 'TRACKER', label: 'Tracker', icon: '📋' },
];

export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <View style={styles.bottomTabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabBarItem}
            onPress={() => onSelectTab(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBarIcon, isActive && styles.tabBarIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabBarLabel, isActive && styles.tabBarLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicatorDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

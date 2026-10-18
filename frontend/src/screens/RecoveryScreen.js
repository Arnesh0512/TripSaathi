import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styles } from '../styles/appStyles';
import { tripApi } from '../services/api';

export default function RecoveryScreen({
  disruption,
  user,
  token,
  onNavigateToDashboard,
}) {
  const [holdApproved, setHoldApproved] = useState(false);
  const [cabRetimed, setCabRetimed] = useState(false);
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    if (disruption?.todos) {
      setTodos(disruption.todos);
    } else {
      setTodos([]);
    }
  }, [disruption]);

  const isArneshWithDisruption =
    user?.email?.toLowerCase() === 'arnesh052006@gmail.com' && disruption;

  const toggleTodo = async (id) => {
    const targetTodo = todos.find((t) => t.id === id);
    if (!targetTodo) return;

    const newDone = !targetTodo.done;
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: newDone } : t))
    );

    try {
      if (token) {
        await tripApi.toggleDisruptionTodo(id, newDone, token);
      }
    } catch (e) {
      console.warn('Failed to persist todo update in MongoDB:', e);
    }
  };

  const completedCount = todos.filter((t) => t.done).length;

  return (
    <View style={styles.activeScreenBox}>
      {/* Title */}
      <View style={styles.screenTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.screenTitleSerif}>Recovery & Policies</Text>
          <View
            style={{
              backgroundColor: isArneshWithDisruption ? '#ECFDF5' : '#F3EFEA',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isArneshWithDisruption ? '#A7F3D0' : '#DFD8CE',
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                color: isArneshWithDisruption ? '#047857' : '#786C5E',
              }}
            >
              {isArneshWithDisruption ? 'ZERO LOSS RECOVERY' : 'PROTECTED'}
            </Text>
          </View>
        </View>
        <Text style={styles.screenStepBadge}>STAGE 04</Text>
      </View>
      <Text style={styles.impactSubText}>
        Scraped policy intelligence, financial protection & action checklist
      </Text>

      {/* When NO disruption data in DB or user is not arnesh052006@gmail.com */}
      {!isArneshWithDisruption ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateIcon}>💡</Text>
          <Text style={styles.emptyStateTitle}>No Recovery Actions Needed</Text>
          <Text style={styles.emptyStateDesc}>
            All bookings and transit connections are intact with zero delay penalties. Scraped hotel & airline policies, claim vouchers, and recovery tasks will appear here if a disruption occurs.
          </Text>
          <TouchableOpacity
            style={[styles.primaryTerracottaBtn, { paddingVertical: 10, paddingHorizontal: 16 }]}
            onPress={onNavigateToDashboard}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryTerracottaBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* When arnesh052006@gmail.com is signed in and has disruption stored in DB */
        <View>
          {/* 1. FINANCIAL RECOVERY SUMMARY */}
          <View style={styles.recoveryStatCard}>
            <View>
              <Text style={styles.recoveryStatLabel}>TOTAL BOOKING VALUE PROTECTED</Text>
              <Text style={styles.recoveryStatAmount}>
                {disruption.protected_amount || '₹12,007 • 100% RECOVERED'}
              </Text>
            </View>
            <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#065F46' }}>
                {disruption.penalty_amount || '₹0 PENALTY'}
              </Text>
            </View>
          </View>

          {/* 2. SCRAPED POLICY INTELLIGENCE (TinyFish Web Scraped) */}
          <Text style={styles.affectedHeading}>SCRAPED CANCELLATION & POSTPONEMENT POLICIES</Text>

          {/* StayPulse Hotel Policy */}
          {disruption.hotel_policy && (
            <View style={styles.policySectionBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.policySectionTitle}>
                  {disruption.hotel_policy.title || '🏨 Taj Lands End Policy (stay-pulse.vercel.app)'}
                </Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#0284C7' }}>TINYFISH SCRAPED</Text>
              </View>
              <Text style={styles.policySectionText}>{disruption.hotel_policy.text}</Text>
            </View>
          )}

          {/* SkyPulse / Airline Policy */}
          {disruption.airline_policy && (
            <View style={styles.policySectionBox}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.policySectionTitle}>
                  {disruption.airline_policy.title || '✈️ IndiGo 6E-2041 Policy (demo-arilines.vercel.app)'}
                </Text>
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#0284C7' }}>TINYFISH SCRAPED</Text>
              </View>
              <Text style={styles.policySectionText}>{disruption.airline_policy.text}</Text>
            </View>
          )}

          {/* 3. ONE-CLICK RECOVERY ACTIONS */}
          <Text style={styles.affectedHeading}>RECOMMENDED RECOVERY ACTIONS</Text>

          {/* Option 1: Hotel Hold */}
          <View style={styles.recoveryOptionCard}>
            <View style={styles.recoveryOptionHeader}>
              <Text style={styles.recoveryOptionBadge}>PRIMARY ACTION • ZERO PENALTY</Text>
              <Text style={styles.badgeGreen}>Low Impact</Text>
            </View>
            <Text style={styles.recoveryOptionTitle}>Hold Hotel Check-in Until 23:59</Text>
            <Text style={styles.recoveryOptionDesc}>
              Auto-dispatches verified delay certificate with PNR-DEL-882 to Taj Lands End front desk. Keeps Deluxe Room held through midnight.
            </Text>
            <View style={styles.recoveryOptionFooter}>
              <Text style={styles.recoveryTimeText}>Expected response: Instant hold confirmation</Text>
              <TouchableOpacity
                style={[styles.approveActionBtn, holdApproved && { backgroundColor: '#059669' }]}
                onPress={() => setHoldApproved(!holdApproved)}
                activeOpacity={0.8}
              >
                <Text style={styles.approveActionBtnText}>
                  {holdApproved ? '✓ Hold Confirmed' : '⚡ Approve Hotel Hold'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Option 2: Re-time Cab */}
          <View style={styles.recoveryOptionCard}>
            <View style={styles.recoveryOptionHeader}>
              <Text style={styles.recoveryOptionBadge}>TRANSIT SYNC</Text>
              <Text style={styles.badgeAmber}>Medium Impact</Text>
            </View>
            <Text style={styles.recoveryOptionTitle}>Re-time Airport Chauffeur to 16:30</Text>
            <Text style={styles.recoveryOptionDesc}>
              Sends updated landing timestamp (16:15 BOM T2) to cab driver to waive wait fees.
            </Text>
            <View style={styles.recoveryOptionFooter}>
              <Text style={styles.recoveryTimeText}>Est. savings: ₹450 waiting charge waived</Text>
              <TouchableOpacity
                style={[styles.approveActionBtn, cabRetimed && { backgroundColor: '#059669' }]}
                onPress={() => setCabRetimed(!cabRetimed)}
                activeOpacity={0.8}
              >
                <Text style={styles.approveActionBtnText}>
                  {cabRetimed ? '✓ Cab Retimed' : 'Sync Chauffeur Pickup'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. MERGED DISRUPTION ACTION CHECKLIST (FROM DB) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 }}>
            <Text style={styles.affectedHeading}>DISRUPTION ACTION CHECKLIST</Text>
            <View style={{ backgroundColor: '#F3EFEA', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#786C5E' }}>
                {completedCount}/{todos.length} Complete
              </Text>
            </View>
          </View>

          {todos.map((todo) => (
            <TouchableOpacity
              key={todo.id}
              style={styles.todoCardItem}
              onPress={() => toggleTodo(todo.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.todoCheckSquare, todo.done && styles.todoCheckSquareActive]}>
                {todo.done && <Text style={styles.todoCheckmarkText}>✓</Text>}
              </View>
              <View style={styles.todoContentBox}>
                <Text style={[styles.todoItemTitle, todo.done && styles.todoItemTitleDone]}>
                  {todo.title}
                </Text>
                <Text style={styles.todoItemKicker}>{todo.sub}</Text>
              </View>
              <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#64748B' }}>
                  {todo.category}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

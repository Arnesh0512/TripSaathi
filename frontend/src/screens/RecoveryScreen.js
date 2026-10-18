import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/appStyles';

export default function RecoveryScreen() {
  const [holdApproved, setHoldApproved] = useState(false);
  const [cabRetimed, setCabRetimed] = useState(false);

  // Merged Tracker To-Do checklist items
  const [todos, setTodos] = useState([
    {
      id: 1,
      title: 'Send automated check-in hold notice to Taj Lands End',
      sub: 'Guarantees room held until 23:59 under StayPulse policy',
      done: true,
      category: 'HOTEL',
    },
    {
      id: 2,
      title: 'Re-time airport cab chauffeur pickup to 16:30',
      sub: 'Matches revised IndiGo 6E-2041 landing time at BOM T2',
      done: true,
      category: 'TRANSIT',
    },
    {
      id: 3,
      title: 'Claim flight delay refreshment voucher at DEL T3',
      sub: 'Eligible under DGCA 2h+ delay charter (approx. ₹750 value)',
      done: false,
      category: 'AIRLINE',
    },
    {
      id: 4,
      title: 'Monitor baggage carousel at BOM Terminal 2',
      sub: 'Track priority baggage delivery for flight 6E-2041',
      done: false,
      category: 'AIRLINE',
    },
  ]);

  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const completedCount = todos.filter((t) => t.done).length;

  return (
    <View style={styles.activeScreenBox}>
      {/* Title */}
      <View style={styles.screenTitleRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.screenTitleSerif}>Recovery & Policies</Text>
          <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0' }}>
            <Text style={{ fontSize: 9, fontWeight: '800', color: '#047857' }}>ZERO LOSS RECOVERY</Text>
          </View>
        </View>
        <Text style={styles.screenStepBadge}>STAGE 04</Text>
      </View>
      <Text style={styles.impactSubText}>
        Scraped policy intelligence, financial protection & merged action checklist
      </Text>

      {/* 1. FINANCIAL RECOVERY SUMMARY */}
      <View style={styles.recoveryStatCard}>
        <View>
          <Text style={styles.recoveryStatLabel}>TOTAL BOOKING VALUE PROTECTED</Text>
          <Text style={styles.recoveryStatAmount}>₹12,007 • 100% RECOVERED</Text>
        </View>
        <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#065F46' }}>₹0 PENALTY</Text>
        </View>
      </View>

      {/* 2. SCRAPED POLICY INTELLIGENCE (TinyFish Web Scraped) */}
      <Text style={styles.affectedHeading}>SCRAPED CANCELLATION & POSTPONEMENT POLICIES</Text>

      {/* StayPulse Hotel Policy */}
      <View style={styles.policySectionBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.policySectionTitle}>🏨 Taj Lands End Policy (stay-pulse.vercel.app)</Text>
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#0284C7' }}>TINYFISH SCRAPED</Text>
        </View>
        <Text style={styles.policySectionText}>
          • <Text style={{ fontWeight: '700', color: '#0F172A' }}>Late Arrival / Postponement Rule:</Text> Guaranteed Check-in Hold until 23:59 is granted free of cost when flight delay notice is submitted with PNR.
        </Text>
        <Text style={styles.policySectionText}>
          • <Text style={{ fontWeight: '700', color: '#0F172A' }}>Rebooking Assessment:</Text> <Text style={{ color: '#047857', fontWeight: '700' }}>NO REBOOKING NEEDED</Text>. Hotel room slot is preserved with zero cancellation charges.
        </Text>
      </View>

      {/* SkyPulse / Airline Policy */}
      <View style={styles.policySectionBox}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.policySectionTitle}>✈️ IndiGo 6E-2041 Policy (demo-arilines.vercel.app)</Text>
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#0284C7' }}>TINYFISH SCRAPED</Text>
        </View>
        <Text style={styles.policySectionText}>
          • <Text style={{ fontWeight: '700', color: '#0F172A' }}>Delay Rule (&gt; 2 Hours):</Text> Passengers are entitled to complimentary terminal meal/beverage vouchers and free 1-time flight rescheduling or 100% refund without cancellation deduction.
        </Text>
        <Text style={styles.policySectionText}>
          • <Text style={{ fontWeight: '700', color: '#0F172A' }}>Financial Protection:</Text> ₹4,508 fare value safe.
        </Text>
      </View>

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
          Updates driver pickup window at BOM Terminal 2 to align with new 16:15 landing.
        </Text>
        <View style={styles.recoveryOptionFooter}>
          <Text style={styles.recoveryTimeText}>Window adjusted to 16:30</Text>
          <TouchableOpacity
            style={[styles.outlineActionBtn, cabRetimed && { backgroundColor: '#0284C7', borderColor: '#0284C7' }]}
            onPress={() => setCabRetimed(!cabRetimed)}
            activeOpacity={0.8}
          >
            <Text style={[styles.outlineActionBtnText, cabRetimed && { color: '#fff' }]}>
              {cabRetimed ? '✓ Pickup Re-timed' : '🚗 Re-time Cab'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. MERGED ACTION TRACKER / TO-DO LIST */}
      <View style={{ marginTop: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.affectedHeading}>RECOVERY ACTION CHECKLIST ({completedCount}/{todos.length})</Text>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>
            {Math.round((completedCount / todos.length) * 100)}% Complete
          </Text>
        </View>

        {todos.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={styles.todoCardItem}
            onPress={() => toggleTodo(t.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.todoCheckSquare, t.done && styles.todoCheckSquareActive]}>
              {t.done && <Text style={styles.todoCheckmarkText}>✓</Text>}
            </View>
            <View style={styles.todoContentBox}>
              <Text style={[styles.todoItemTitle, t.done && styles.todoItemTitleDone]}>
                {t.title}
              </Text>
              <Text style={styles.todoItemKicker}>{t.sub}</Text>
            </View>
            <View style={{ backgroundColor: '#F3EFEA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#786C5E' }}>{t.category}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transparency Note */}
      <View style={styles.scopeNoteBox}>
        <Text style={styles.scopeNoteTitle}>INTELLIGENCE ENGINE</Text>
        <Text style={styles.scopeNoteBody}>
          Policy scraping and booking slot holding executed autonomously via TinyFish agent. ChatGPT reasoning is invoked only when edge-case disruption arbitrations are required.
        </Text>
      </View>
    </View>
  );
}

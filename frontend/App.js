import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const BACKEND_URL = 'http://localhost:7000';
const GOOGLE_CLIENT_ID = '258416843143-ahnf9rasq8blnra0gcq7rr5cn77s9qsd.apps.googleusercontent.com';

// Warm Editorial Theme Palette matching TripSaathi Recovery Story
const THEME = {
  bg: '#FAF6F0',                 // Warm cream / ivory canvas
  bgAlt: '#F3EDE4',              // Secondary warm cream
  paper: '#FFFFFF',              // Pure white paper card
  paperSubtle: '#FAF7F2',        // Soft cream tint
  border: '#E5DFD5',             // Warm delicate hairline border
  borderDark: '#D6CFC3',         // Structured border
  
  primary: '#A83827',            // Burnt terracotta / brick red
  primaryHover: '#8E2E1F',       // Deep terracotta
  primaryLight: 'rgba(168, 56, 39, 0.08)',
  primaryBorder: 'rgba(168, 56, 39, 0.3)',
  
  text: '#1E1B18',               // Deep charcoal / espresso
  textSecondary: '#6E675F',      // Warm slate / stone
  textMuted: '#9B9389',          // Muted taupe
  
  green: '#2E6F40',              // Sage green (On Time / Confirmed / Low)
  greenBg: 'rgba(46, 111, 64, 0.1)',
  
  amber: '#C25E1A',              // Burnt ochre (At Risk / Medium)
  amberBg: 'rgba(194, 94, 26, 0.1)',
};

const SERIF_FONT = Platform.select({
  web: "'Playfair Display', Georgia, 'Times New Roman', serif",
  default: 'serif',
});

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ADD' | 'DASH' | 'IMPACT' | 'RECOVERY' | 'TRACKER'

  // Profile Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [homeLocation, setHomeLocation] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // Initialize Google Identity Services for Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const scriptId = 'google-gsi-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => initGoogleWebButton();
        document.body.appendChild(script);
      } else {
        initGoogleWebButton();
      }
    }
  }, [token]);

  const initGoogleWebButton = () => {
    if (window.google && window.google.accounts && !token) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
      });
      const btnParent = document.getElementById('googleSignInBtn');
      if (btnParent) {
        btnParent.innerHTML = '';
        window.google.accounts.id.renderButton(btnParent, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 280,
        });
      }
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    await exchangeGoogleTokenWithBackend(response.credential);
  };

  const exchangeGoogleTokenWithBackend = async (googleJwt) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleJwt }),
      });
      const data = await res.json();
      if (res.ok && data.access_token) {
        setToken(data.access_token);
        setUser(data.user);
        await fetchUserProfile(data.access_token);
      } else {
        alertError(data.detail || 'Authentication failed');
      }
    } catch (err) {
      alertError('Failed to connect to backend: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (jwtToken) => {
    try {
      const res = await fetch(`${BACKEND_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone_number || '');
        setGender(data.gender || 'Male');
        setDob(data.date_of_birth || '');
        setCalculatedAge(data.age);
        setHomeLocation(data.home_location || '');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const handleDobChange = (text) => {
    setDob(text);
    if (text.length >= 8) {
      const parts = text.includes('-') ? text.split('-') : text.split('/');
      if (parts.length === 3) {
        const year = parts[0].length === 4 ? parseInt(parts[0]) : parseInt(parts[2]);
        const currentYear = new Date().getFullYear();
        if (year > 1900 && year <= currentYear) {
          setCalculatedAge(currentYear - year);
          return;
        }
      }
    }
    setCalculatedAge(null);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`${BACKEND_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          phone_number: phone.trim(),
          gender,
          date_of_birth: dob.trim(),
          home_location: homeLocation.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setCalculatedAge(data.age);
        setSaveMessage('✅ Profile updated successfully in TripSaathi database!');
        setTimeout(() => setSaveMessage(null), 3500);
      } else {
        alertError(data.detail || 'Could not update profile');
      }
    } catch (err) {
      alertError('Network error: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = () => {
    setToken(null);
    setUser(null);
    setProfileModalVisible(false);
  };

  const alertError = (msg) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Notice', msg);
    }
  };

  const isProfileIncomplete = user && (!user.phone_number || !user.date_of_birth || !user.home_location);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* TOP EDITORIAL HEADER */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>TripSaathi</Text>
          <View style={styles.kickerBadge}>
            <Text style={styles.kickerBadgeText}>CONNECTED TRAVEL RECOVERY</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {user ? (
            <TouchableOpacity
              style={styles.avatarTouchable}
              onPress={() => setProfileModalVisible(true)}
              activeOpacity={0.8}
            >
              {user.profile_pic ? (
                <Image source={{ uri: user.profile_pic }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.onlineDot} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.headerSignInBtn}
              onPress={() => exchangeGoogleTokenWithBackend('mock_google_token_dev')}
            >
              <Text style={styles.headerSignInBtnText}>⚡ Dev Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* EDITORIAL HERO SECTION */}
        <View style={styles.heroSection}>
          <Text style={styles.heroKicker}>AI-ASSISTED RECOVERY FOR CONNECTED TRAVEL</Text>
          <Text style={styles.heroTitle}>
            A credible MVP,{'\n'}not a promise to automate everything.
          </Text>
          <View style={styles.terracottaBar} />
          <Text style={styles.heroSubtitle}>
            When a journey breaks, help the whole trip recover. One disruption triggers a downstream chain reaction — we detect changes, validate rules, and empower you to decide.
          </Text>
        </View>

        {/* PROFILE COMPLETION BANNER (IF LOGGED IN AND MISSING FIELDS) */}
        {user && isProfileIncomplete && (
          <View style={styles.promptBanner}>
            <Text style={styles.promptIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.promptTitle}>Complete your traveler profile</Text>
              <Text style={styles.promptDesc}>
                Add your phone number, date of birth, and home city so recovery options can auto-align with your trip.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.promptActionBtn}
              onPress={() => setProfileModalVisible(true)}
            >
              <Text style={styles.promptActionBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LOGGED IN USER STATUS BAR */}
        {user && (
          <View style={styles.userStatusBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userStatusGreeting}>Signed in as {user.name || user.email}</Text>
              <Text style={styles.userStatusSub}>Click your avatar anytime to view & edit your profile details.</Text>
            </View>
            <TouchableOpacity
              style={styles.userStatusEditBtn}
              onPress={() => setProfileModalVisible(true)}
            >
              <Text style={styles.userStatusEditBtnText}>View Profile 👤</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* GOOGLE SIGN IN CARD (SHOWN WHEN LOGGED OUT) */}
        {!token && (
          <View style={styles.authCard}>
            <Text style={styles.authCardKicker}>AUTHENTICATION</Text>
            <Text style={styles.authCardTitle}>Sign in to TripSaathi</Text>
            <Text style={styles.authCardSub}>
              Connect with Google to securely store your trip records, manage downstream bookings, and sync profile recovery preferences.
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color={THEME.primary} style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.loginActionsContainer}>
                {/* Official Google GIS Button placeholder */}
                <View id="googleSignInBtn" style={styles.googleBtnContainer} />

                {/* Developer Fast Login */}
                <TouchableOpacity
                  style={styles.quickDevBtn}
                  onPress={() => exchangeGoogleTokenWithBackend('mock_google_token_dev')}
                >
                  <Text style={styles.quickDevBtnText}>⚡ One-Tap Fast Sign In (Developer Mode)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* INTERACTIVE NAVIGATION TABS */}
        <View style={styles.tabContainer}>
          {[
            { id: 'ALL', label: 'All Screens' },
            { id: 'ADD', label: 'Add Trip' },
            { id: 'DASH', label: 'Trip Dashboard' },
            { id: 'IMPACT', label: 'Impact View' },
            { id: 'RECOVERY', label: 'Recovery Plans' },
            { id: 'TRACKER', label: 'Action Tracker' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FLOWS CONTAINER (MOCKUP CARDS IN NEW THEME) */}
        <View style={styles.flowLayout}>
          <ScrollView
            horizontal={activeTab === 'ALL'}
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.flowRow}
          >
            {/* 1. ADD TRIP SCREEN */}
            {(activeTab === 'ALL' || activeTab === 'ADD') && (
              <View style={styles.phoneScreenContainer}>
                <Text style={styles.screenLabel}>ADD TRIP</Text>
                <View style={styles.phoneMockup}>
                  <View style={styles.screenHeader}>
                    <Text style={styles.backArrow}>←</Text>
                    <Text style={styles.screenHeaderTitle}>Add Trip</Text>
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputPrefix}>From</Text>
                    <View style={styles.inputFieldMock}>
                      <Text style={styles.inputAirportCode}>DEL</Text>
                      <Text style={styles.inputCityName}>New Delhi</Text>
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputPrefix}>To</Text>
                    <View style={styles.inputFieldMock}>
                      <Text style={styles.inputAirportCode}>BOM</Text>
                      <Text style={styles.inputCityName}>Mumbai</Text>
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputPrefix}>Date</Text>
                    <View style={styles.inputFieldMock}>
                      <Text style={styles.inputDateText}>24 May 2025</Text>
                      <Text style={styles.calendarIcon}>📅</Text>
                    </View>
                  </View>

                  <View style={styles.inputRow}>
                    <Text style={styles.inputPrefix}>Passengers</Text>
                    <View style={styles.inputFieldMock}>
                      <Text style={styles.inputDateText}>1</Text>
                      <Text style={styles.chevronIcon}>›</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.terracottaBtn} activeOpacity={0.85}>
                    <Text style={styles.terracottaBtnText}>Add Trip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ARROW CONNECTOR */}
            {activeTab === 'ALL' && <Text style={styles.flowArrow}>→</Text>}

            {/* 2. TRIP DASHBOARD SCREEN */}
            {(activeTab === 'ALL' || activeTab === 'DASH') && (
              <View style={styles.phoneScreenContainer}>
                <Text style={styles.screenLabel}>TRIP DASHBOARD</Text>
                <View style={styles.phoneMockup}>
                  <Text style={styles.dashboardTitle}>Trip Dashboard</Text>
                  
                  {/* Subtabs */}
                  <View style={styles.dashboardSubtabs}>
                    <Text style={[styles.subtabItem, styles.subtabItemActive]}>Overview</Text>
                    <Text style={styles.subtabItem}>Updates</Text>
                    <Text style={styles.subtabItem}>Alerts</Text>
                  </View>

                  <Text style={styles.routeHeader}>Delhi → Mumbai</Text>
                  <Text style={styles.routeDate}>24 May 2025</Text>

                  {/* Segments */}
                  <View style={styles.segmentList}>
                    <View style={styles.segmentItem}>
                      <Text style={styles.segmentIcon}>✈️</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.segmentName}>Flight</Text>
                      </View>
                      <Text style={styles.tagGreen}>On Time</Text>
                    </View>

                    <View style={styles.segmentItem}>
                      <Text style={styles.segmentIcon}>🚆</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.segmentName}>Rail</Text>
                        <Text style={styles.segmentMeta}>ID: 146aved</Text>
                      </View>
                      <Text style={styles.tagAmber}>At Risk</Text>
                    </View>

                    <View style={styles.segmentItem}>
                      <Text style={styles.segmentIcon}>🏨</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.segmentName}>Hotel</Text>
                      </View>
                      <Text style={styles.tagGreen}>Confirmed</Text>
                    </View>

                    <View style={styles.segmentItem}>
                      <Text style={styles.segmentIcon}>🚗</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.segmentName}>Ground Transfer</Text>
                      </View>
                      <Text style={styles.tagMuted}>Scheduled</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ARROW CONNECTOR */}
            {activeTab === 'ALL' && <Text style={styles.flowArrow}>→</Text>}

            {/* 3. IMPACT VIEW SCREEN */}
            {(activeTab === 'ALL' || activeTab === 'IMPACT') && (
              <View style={styles.phoneScreenContainer}>
                <Text style={styles.screenLabel}>IMPACT VIEW</Text>
                <View style={styles.phoneMockup}>
                  <Text style={styles.impactTitle}>Impact View</Text>
                  <Text style={styles.impactSub}>What Check-in affected</Text>

                  {/* Delay Hero Box */}
                  <View style={styles.delayBox}>
                    <Text style={styles.delayBoxLabel}>Likely Delay</Text>
                    <Text style={styles.delayBoxHero}>2h 30m</Text>
                    <Text style={styles.delayBoxLocation}>Arrival in Mumbai</Text>
                  </View>

                  <View style={styles.impactItemList}>
                    <View style={styles.impactRow}>
                      <Text style={styles.impactRowLabel}>Hotel Check-in</Text>
                      <Text style={styles.tagAmber}>At Risk</Text>
                    </View>

                    <View style={styles.impactRow}>
                      <Text style={styles.impactRowLabel}>Evening Activity</Text>
                      <Text style={styles.tagAmber}>At Risk</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ARROW CONNECTOR */}
            {activeTab === 'ALL' && <Text style={styles.flowArrow}>→</Text>}

            {/* 4. RECOVERY PLANS SCREEN */}
            {(activeTab === 'ALL' || activeTab === 'RECOVERY') && (
              <View style={styles.phoneScreenContainer}>
                <Text style={styles.screenLabel}>RECOVERY PLANS</Text>
                <View style={styles.phoneMockup}>
                  <Text style={styles.recoveryTitle}>Recovery Plans</Text>
                  <Text style={styles.recoverySub}>Recommended options</Text>

                  <View style={styles.optionBox}>
                    <Text style={styles.optionHeader}>Option 1</Text>
                    <Text style={styles.optionAction}>Hold hotel check-in</Text>
                    <View style={styles.optionMetaRow}>
                      <Text style={styles.optionTime}>2:00 PM</Text>
                      <Text style={styles.optionImpactGreen}>Impact: Low</Text>
                    </View>
                  </View>

                  <View style={styles.optionBox}>
                    <Text style={styles.optionHeader}>Option 2</Text>
                    <Text style={styles.optionAction}>Alternative activity</Text>
                    <View style={styles.optionMetaRow}>
                      <Text style={styles.optionTime}>6:00 PM</Text>
                      <Text style={styles.optionImpactAmber}>Impact: Medium</Text>
                    </View>
                  </View>

                  <View style={styles.optionBox}>
                    <Text style={styles.optionHeader}>Option 3</Text>
                    <Text style={styles.optionAction}>Early check-in request</Text>
                    <View style={styles.optionMetaRow}>
                      <Text style={styles.optionTime}>12:00 PM</Text>
                      <Text style={styles.optionImpactGreen}>Impact: Low</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ARROW CONNECTOR */}
            {activeTab === 'ALL' && <Text style={styles.flowArrow}>→</Text>}

            {/* 5. ACTION TRACKER SCREEN */}
            {(activeTab === 'ALL' || activeTab === 'TRACKER') && (
              <View style={styles.phoneScreenContainer}>
                <Text style={styles.screenLabel}>ACTION TRACKER</Text>
                <View style={styles.phoneMockup}>
                  <Text style={styles.trackerTitle}>Action Tracker</Text>
                  <Text style={styles.trackerSub}>Stay on top of what matters</Text>

                  <View style={styles.trackerSection}>
                    <Text style={styles.trackerCategory}>To Do</Text>
                    <Text style={styles.trackerItem}>• Contact hotel</Text>
                    <Text style={styles.trackerItem}>• Request early check-in</Text>
                  </View>

                  <View style={styles.trackerSection}>
                    <Text style={styles.trackerCategory}>In Progress</Text>
                    <Text style={styles.trackerItem}>• Track flight status</Text>
                    <Text style={styles.trackerItem}>• Monitor rail update</Text>
                  </View>

                  <View style={styles.trackerSection}>
                    <Text style={styles.trackerCategory}>Completed</Text>
                    <Text style={[styles.trackerItem, styles.trackerItemDone]}>✓ Trip created</Text>
                    <Text style={[styles.trackerItem, styles.trackerItemDone]}>✓ Hotel confirmed</Text>
                  </View>
                </View>
              </View>
            )}

            {/* SCOPE NOTES CARD */}
            <View style={styles.scopeNotesCard}>
              <Text style={styles.scopeNotesHeading}>SCOPE NOTES</Text>
              <View style={styles.scopeNotesDivider} />

              <View style={styles.scopeNoteBlock}>
                <Text style={styles.scopeNoteText}>
                  Flight live data only where access is confirmed
                </Text>
              </View>
              <View style={styles.scopeNoteDividerSub} />

              <View style={styles.scopeNoteBlock}>
                <Text style={styles.scopeNoteText}>
                  Rail updates may be replay / simulation unless authorized
                </Text>
              </View>
              <View style={styles.scopeNoteDividerSub} />

              <View style={styles.scopeNoteBlock}>
                <Text style={styles.scopeNoteText}>
                  Consumer-account rail automation out of scope where prohibited
                </Text>
              </View>
              <View style={styles.scopeNoteDividerSub} />

              <View style={styles.scopeNoteBlock}>
                <Text style={styles.scopeNoteText}>
                  Some actions are guided handoffs
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* DECISION PHILOSOPHY ACCENT BANNER */}
        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyKicker}>THE RECOVERY PRINCIPLE</Text>
          <Text style={styles.philosophyTitle}>Keeping your existing plan is always a valid recommendation.</Text>
          <Text style={styles.philosophyDesc}>
            The best fix isn’t always a rebooking. TripSaathi compares preserving your existing plan against changing affected connections or continuing the next day — and the user approves exact actions.
          </Text>
        </View>
      </ScrollView>

      {/* USER PROFILE MODAL (RESTYLED IN EDITORIAL CREAM/TERRACOTTA THEME) */}
      <Modal
        visible={profileModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalKicker}>TRIPSAATHI ACCOUNT</Text>
                <Text style={styles.modalTitle}>Traveler Profile</Text>
              </View>
              <TouchableOpacity
                onPress={() => setProfileModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Profile Avatar Header */}
              <View style={styles.modalProfileHeader}>
                {user?.profile_pic ? (
                  <Image source={{ uri: user.profile_pic }} style={styles.modalAvatarImg} />
                ) : (
                  <View style={styles.modalAvatarFallback}>
                    <Text style={styles.modalAvatarFallbackText}>
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.modalGoogleBadge}>
                  <Text style={styles.modalGoogleBadgeText}>✓ Google Verified Identity</Text>
                </View>
              </View>

              {saveMessage && <Text style={styles.successBanner}>{saveMessage}</Text>}

              {/* Form Fields */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS (NON-EDITABLE)</Text>
                <View style={styles.disabledInputContainer}>
                  <TextInput
                    style={[styles.input, styles.disabledInput]}
                    value={email}
                    editable={false}
                  />
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 9876543210"
                  placeholderTextColor={THEME.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>GENDER</Text>
                <View style={styles.genderRow}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderBtnText,
                          gender === g && styles.genderBtnTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.fieldLabel}>DATE OF BIRTH (YYYY-MM-DD)</Text>
                  {calculatedAge !== null && (
                    <Text style={styles.ageBadge}>Age: {calculatedAge} yrs (Auto)</Text>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  value={dob}
                  onChangeText={handleDobChange}
                  placeholder="2000-05-15"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>HOME CITY / LOCATION</Text>
                <TextInput
                  style={styles.input}
                  value={homeLocation}
                  onChangeText={setHomeLocation}
                  placeholder="e.g. New Delhi, India"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                <Text style={styles.signOutBtnText}>Sign Out from TripSaathi</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  kickerBadge: {
    backgroundColor: THEME.primaryLight,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  kickerBadgeText: {
    color: THEME.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSignInBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  headerSignInBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.green,
    borderWidth: 2,
    borderColor: THEME.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  heroSection: {
    width: '100%',
    maxWidth: 1100,
    marginBottom: 28,
  },
  heroKicker: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 38,
    lineHeight: 46,
    color: THEME.text,
    marginBottom: 14,
    fontWeight: '600',
  },
  terracottaBar: {
    width: 60,
    height: 4,
    backgroundColor: THEME.primary,
    marginBottom: 16,
    borderRadius: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 25,
    color: THEME.textSecondary,
    maxWidth: 750,
  },
  promptBanner: {
    width: '100%',
    maxWidth: 1100,
    backgroundColor: THEME.amberBg,
    borderWidth: 1,
    borderColor: 'rgba(194, 94, 26, 0.3)',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  promptIcon: {
    fontSize: 20,
  },
  promptTitle: {
    color: THEME.amber,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  promptDesc: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  promptActionBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 4,
  },
  promptActionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  userStatusBar: {
    width: '100%',
    maxWidth: 1100,
    backgroundColor: THEME.paper,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  userStatusGreeting: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 2,
  },
  userStatusSub: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  userStatusEditBtn: {
    backgroundColor: THEME.bgAlt,
    borderWidth: 1,
    borderColor: THEME.borderDark,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  userStatusEditBtnText: {
    color: THEME.text,
    fontWeight: '600',
    fontSize: 12,
  },
  authCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: THEME.paper,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 26,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  authCardKicker: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  authCardTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
  },
  authCardSub: {
    fontSize: 13,
    lineHeight: 20,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginActionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  googleBtnContainer: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDevBtn: {
    marginTop: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    backgroundColor: THEME.primaryLight,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
  },
  quickDevBtnText: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    maxWidth: 1100,
    marginBottom: 20,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: THEME.bgAlt,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  tabBtnActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  flowLayout: {
    width: '100%',
    maxWidth: 1100,
    marginBottom: 36,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingBottom: 16,
  },
  flowArrow: {
    fontSize: 22,
    color: THEME.primary,
    alignSelf: 'center',
    opacity: 0.6,
  },
  phoneScreenContainer: {
    alignItems: 'center',
    width: 220,
  },
  screenLabel: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    textAlign: 'center',
  },
  phoneMockup: {
    width: '100%',
    minHeight: 390,
    backgroundColor: THEME.paper,
    borderWidth: 1,
    borderColor: THEME.borderDark,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backArrow: {
    fontSize: 14,
    color: THEME.text,
  },
  screenHeaderTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },
  inputRow: {
    marginBottom: 10,
  },
  inputPrefix: {
    fontSize: 10,
    color: THEME.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputFieldMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: THEME.paperSubtle,
  },
  inputAirportCode: {
    fontWeight: '800',
    fontSize: 12,
    color: THEME.text,
  },
  inputCityName: {
    fontSize: 11,
    color: THEME.textSecondary,
  },
  inputDateText: {
    fontSize: 11,
    color: THEME.text,
    fontWeight: '600',
  },
  calendarIcon: {
    fontSize: 11,
  },
  chevronIcon: {
    fontSize: 14,
    color: THEME.textMuted,
  },
  terracottaBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  terracottaBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  dashboardTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 6,
  },
  dashboardSubtabs: {
    flexDirection: 'row',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 6,
    marginBottom: 10,
  },
  subtabItem: {
    fontSize: 10,
    color: THEME.textMuted,
    fontWeight: '600',
  },
  subtabItemActive: {
    color: THEME.primary,
    borderBottomWidth: 2,
    borderBottomColor: THEME.primary,
    paddingBottom: 4,
  },
  routeHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.text,
  },
  routeDate: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginBottom: 10,
  },
  segmentList: {
    gap: 8,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.paperSubtle,
  },
  segmentIcon: {
    fontSize: 12,
  },
  segmentName: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.text,
  },
  segmentMeta: {
    fontSize: 9,
    color: THEME.textMuted,
  },
  tagGreen: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.green,
    backgroundColor: THEME.greenBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  tagAmber: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.amber,
    backgroundColor: THEME.amberBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  tagMuted: {
    fontSize: 9,
    color: THEME.textMuted,
    paddingHorizontal: 4,
  },
  impactTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 2,
  },
  impactSub: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginBottom: 12,
  },
  delayBox: {
    borderWidth: 1,
    borderColor: THEME.borderDark,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: THEME.paperSubtle,
  },
  delayBoxLabel: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginBottom: 2,
  },
  delayBoxHero: {
    fontFamily: SERIF_FONT,
    fontSize: 26,
    fontWeight: '800',
    color: THEME.primary,
    marginVertical: 2,
  },
  delayBoxLocation: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  impactItemList: {
    gap: 8,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.paperSubtle,
  },
  impactRowLabel: {
    fontSize: 11,
    color: THEME.text,
    fontWeight: '600',
  },
  recoveryTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 2,
  },
  recoverySub: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginBottom: 10,
  },
  optionBox: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    backgroundColor: THEME.paperSubtle,
  },
  optionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    marginBottom: 2,
  },
  optionAction: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4,
  },
  optionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTime: {
    fontSize: 10,
    color: THEME.textSecondary,
  },
  optionImpactGreen: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.green,
  },
  optionImpactAmber: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.amber,
  },
  trackerTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 2,
  },
  trackerSub: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginBottom: 10,
  },
  trackerSection: {
    marginBottom: 10,
  },
  trackerCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  trackerItem: {
    fontSize: 10,
    color: THEME.textSecondary,
    marginBottom: 2,
  },
  trackerItemDone: {
    color: THEME.green,
  },
  scopeNotesCard: {
    width: 200,
    backgroundColor: THEME.paperSubtle,
    borderWidth: 1,
    borderColor: THEME.borderDark,
    borderRadius: 14,
    padding: 16,
  },
  scopeNotesHeading: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  scopeNotesDivider: {
    height: 2,
    backgroundColor: THEME.primary,
    marginBottom: 12,
  },
  scopeNoteBlock: {
    marginVertical: 4,
  },
  scopeNoteText: {
    fontSize: 11,
    lineHeight: 16,
    color: THEME.textSecondary,
  },
  scopeNoteDividerSub: {
    height: 1,
    backgroundColor: THEME.border,
    marginVertical: 8,
  },
  philosophyCard: {
    width: '100%',
    maxWidth: 1100,
    backgroundColor: THEME.paper,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 24,
  },
  philosophyKicker: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  philosophyTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
  },
  philosophyDesc: {
    fontSize: 13,
    lineHeight: 21,
    color: THEME.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: THEME.paper,
    borderRadius: 14,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: THEME.borderDark,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  modalKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  modalTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 16,
    color: THEME.textSecondary,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 22,
  },
  modalProfileHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  modalAvatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: THEME.primary,
    marginBottom: 8,
  },
  modalAvatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalAvatarFallbackText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  modalGoogleBadge: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primaryBorder,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  modalGoogleBadgeText: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  successBanner: {
    backgroundColor: THEME.greenBg,
    borderColor: THEME.green,
    borderWidth: 1,
    color: THEME.green,
    padding: 10,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: THEME.paperSubtle,
    borderWidth: 1,
    borderColor: THEME.borderDark,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: THEME.text,
    fontSize: 14,
  },
  disabledInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  disabledInput: {
    backgroundColor: THEME.bgAlt,
    color: THEME.textMuted,
    paddingRight: 36,
  },
  lockIcon: {
    position: 'absolute',
    right: 12,
    fontSize: 14,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: THEME.paperSubtle,
    borderWidth: 1,
    borderColor: THEME.borderDark,
  },
  genderBtnActive: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primary,
  },
  genderBtnText: {
    color: THEME.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  genderBtnTextActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
  ageBadge: {
    color: THEME.green,
    fontSize: 11,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  signOutBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutBtnText: {
    color: THEME.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});

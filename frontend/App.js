import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const DEV_MACHINE_IP = '192.168.1.11';
const BACKEND_URL = Platform.OS === 'web' ? 'http://localhost:7000' : `http://${DEV_MACHINE_IP}:7000`;
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
  primaryBorder: 'rgba(168, 56, 39, 0.25)',
  
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
  const { width: windowWidth } = useWindowDimensions();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'ADD_TRIP' | 'IMPACT' | 'RECOVERY' | 'TRACKER'
  const [dashboardSubtab, setDashboardSubtab] = useState('Overview'); // 'Overview' | 'Updates' | 'Alerts'
  const [phoneFrameMode, setPhoneFrameMode] = useState(true); // Toggle phone frame vs full width on web

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

  // Google Auth for Native Mobile (iOS/Android in Expo Go via redirect URL)
  const handleMobileGoogleLogin = async () => {
    try {
      setLoading(true);
      const expoProxyRedirect = 'https://auth.expo.io/@arnesh512/TripSaathi';
      const returnUrl = Linking.createURL('auth');
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `response_type=id_token&` +
        `redirect_uri=${encodeURIComponent(expoProxyRedirect)}&` +
        `scope=${encodeURIComponent('openid profile email')}&` +
        `nonce=${Math.random().toString(36).substring(2)}`;

      const proxyStartUrl = `https://auth.expo.io/@arnesh512/TripSaathi/start?authUrl=${encodeURIComponent(googleAuthUrl)}&returnUrl=${encodeURIComponent(returnUrl)}`;

      const result = await WebBrowser.openAuthSessionAsync(proxyStartUrl, returnUrl);
      if (result.type === 'success' && result.url) {
        const match = result.url.match(/id_token=([^&]+)/);
        if (match && match[1]) {
          await exchangeGoogleTokenWithBackend(match[1]);
          return;
        }
      }
    } catch (err) {
      alertError('Google Sign In error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
          width: 260,
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
        setSaveMessage('✅ Profile updated in TripSaathi database!');
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
  const isDesktopWeb = Platform.OS === 'web' && windowWidth > 600;
  const showPhoneFrame = isDesktopWeb && phoneFrameMode;

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <View style={showPhoneFrame ? styles.desktopBackdrop : styles.fullScreenContainer}>
        <StatusBar style="dark" />

      {/* TOP DESKTOP CONTROLS BAR (Only visible on wide desktop view) */}
      {isDesktopWeb && (
        <View style={styles.desktopControlBar}>
          <View style={styles.desktopControlLeft}>
            <Text style={styles.desktopBrand}>TripSaathi</Text>
            <Text style={styles.desktopModeTag}>Mobile Preview Mode (412×860)</Text>
          </View>
          <TouchableOpacity
            style={styles.desktopViewToggle}
            onPress={() => setPhoneFrameMode(!phoneFrameMode)}
          >
            <Text style={styles.desktopViewToggleText}>
              {phoneFrameMode ? '🖥️ Switch to Full Width' : '📱 Switch to Phone Frame'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PHONE DEVICE CONTAINER */}
      <View style={showPhoneFrame ? styles.phoneFrameWrapper : styles.phoneContentContainer}>
        {/* PHONE SPEAKER / CAMERA NOTCH (Visible when phone frame is active) */}
        {showPhoneFrame && (
          <View style={styles.phoneDynamicIsland}>
            <View style={styles.phoneCameraDot} />
            <View style={styles.phoneSpeakerBar} />
          </View>
        )}

        <SafeAreaView style={styles.phoneInnerCanvas}>
          {/* MOBILE STATUS BAR ROW */}
          <View style={styles.mobileStatusBar}>
            <Text style={styles.mobileStatusTime}>9:41</Text>
            <View style={styles.mobileStatusIcons}>
              <Text style={styles.mobileStatusIconItem}>📶</Text>
              <Text style={styles.mobileStatusIconItem}>🔋</Text>
            </View>
          </View>

          {/* MOBILE APP HEADER */}
          <View style={styles.mobileHeader}>
            <View>
              <Text style={styles.appHeaderTitle}>TripSaathi</Text>
              <Text style={styles.appHeaderSub}>Connected Travel Recovery</Text>
            </View>

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
                style={styles.headerDevBtn}
                onPress={() => exchangeGoogleTokenWithBackend('mock_google_token_dev')}
              >
                <Text style={styles.headerDevBtnText}>⚡ Sign In</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* INCOMPLETE PROFILE REMINDER PILL */}
          {user && isProfileIncomplete && (
            <TouchableOpacity
              style={styles.incompleteProfilePill}
              onPress={() => setProfileModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.incompleteIcon}>⚠️</Text>
              <Text style={styles.incompleteText}>Complete your traveler profile (DOB, phone)</Text>
              <Text style={styles.incompleteArrow}>›</Text>
            </TouchableOpacity>
          )}

          {/* SCROLLABLE SCREEN BODY */}
          <ScrollView
            style={styles.screenScrollView}
            contentContainerStyle={styles.screenScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* GOOGLE SIGN IN CARD (If not signed in) */}
            {!token && (
              <View style={styles.authCard}>
                <Text style={styles.authKicker}>SECURE SIGN IN</Text>
                <Text style={styles.authTitle}>Sign in with Google</Text>
                <Text style={styles.authDesc}>
                  Stores your trip bookings in MongoDB and enables automated cross-provider recovery.
                </Text>

                {loading ? (
                  <ActivityIndicator color={THEME.primary} style={{ marginVertical: 12 }} />
                ) : (
                  <View style={styles.authBtnContainer}>
                    {Platform.OS === 'web' ? (
                      <View id="googleSignInBtn" style={styles.googleBtnBox} />
                    ) : (
                      <TouchableOpacity
                        style={styles.googleNativeBtn}
                        onPress={handleMobileGoogleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                          style={styles.googleLogo}
                        />
                        <Text style={styles.googleNativeBtnText}>Sign in with Google</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.fastDevBtn}
                      onPress={() => exchangeGoogleTokenWithBackend('mock_google_token_dev')}
                    >
                      <Text style={styles.fastDevBtnText}>⚡ One-Tap Fast Developer Sign In</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* SCREEN 1: ADD TRIP */}
            {activeTab === 'ADD_TRIP' && (
              <View style={styles.activeScreenBox}>
                <View style={styles.screenTitleRow}>
                  <Text style={styles.screenTitleSerif}>Add Trip</Text>
                  <Text style={styles.screenStepBadge}>STAGE 01</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldKicker}>FROM</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.airportCode}>DEL</Text>
                    <Text style={styles.cityName}>New Delhi</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldKicker}>TO</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.airportCode}>BOM</Text>
                    <Text style={styles.cityName}>Mumbai</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldKicker}>DATE</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputRegularText}>24 May 2025</Text>
                    <Text style={styles.inputIconRight}>📅</Text>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.fieldKicker}>PASSENGERS</Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputRegularText}>1 passenger</Text>
                    <Text style={styles.inputIconRight}>›</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.primaryTerracottaBtn}
                  onPress={() => setActiveTab('DASHBOARD')}
                >
                  <Text style={styles.primaryTerracottaBtnText}>Add Trip</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SCREEN 2: TRIP DASHBOARD */}
            {activeTab === 'DASHBOARD' && (
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
                    onPress={() => setActiveTab('IMPACT')}
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
            )}

            {/* SCREEN 3: IMPACT VIEW */}
            {activeTab === 'IMPACT' && (
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
                  onPress={() => setActiveTab('RECOVERY')}
                >
                  <Text style={styles.primaryTerracottaBtnText}>View AI Recovery Plans ›</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SCREEN 4: RECOVERY PLANS */}
            {activeTab === 'RECOVERY' && (
              <View style={styles.activeScreenBox}>
                <View style={styles.screenTitleRow}>
                  <Text style={styles.screenTitleSerif}>Recovery Plans</Text>
                  <Text style={styles.screenStepBadge}>STAGE 04</Text>
                </View>
                <Text style={styles.impactSubText}>Deterministic rules-validated options</Text>

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
                      onPress={() => setActiveTab('TRACKER')}
                    >
                      <Text style={styles.approveActionBtnText}>Approve Action</Text>
                    </TouchableOpacity>
                  </View>
                </View>

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
                      onPress={() => setActiveTab('TRACKER')}
                    >
                      <Text style={styles.outlineActionBtnText}>Select Option</Text>
                    </TouchableOpacity>
                  </View>
                </View>

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
                      onPress={() => setActiveTab('TRACKER')}
                    >
                      <Text style={styles.outlineActionBtnText}>Select Option</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* SCREEN 5: ACTION TRACKER */}
            {activeTab === 'TRACKER' && (
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
            )}
          </ScrollView>

          {/* AUTHENTIC MOBILE BOTTOM TAB NAVIGATION BAR */}
          <View style={styles.bottomTabBar}>
            {[
              { id: 'DASHBOARD', label: 'Dashboard', icon: '🏠' },
              { id: 'ADD_TRIP', label: 'Add Trip', icon: '➕' },
              { id: 'IMPACT', label: 'Impact', icon: '⚠️' },
              { id: 'RECOVERY', label: 'Recovery', icon: '💡' },
              { id: 'TRACKER', label: 'Tracker', icon: '📋' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabBarItem}
                  onPress={() => setActiveTab(tab.id)}
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

          {/* HOME INDICATOR BAR (Mobile Bezel) */}
          <View style={styles.homeIndicatorBar} />
        </SafeAreaView>
      </View>

      {/* USER PROFILE MODAL */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopBar}>
              <View>
                <Text style={styles.modalKicker}>TRIPSAATHI ID</Text>
                <Text style={styles.modalTitle}>Traveler Profile</Text>
              </View>
              <TouchableOpacity
                onPress={() => setProfileModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <Text style={styles.closeModalBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody}>
              {/* Profile Avatar */}
              <View style={styles.modalAvatarBox}>
                {user?.profile_pic ? (
                  <Image source={{ uri: user.profile_pic }} style={styles.modalAvatarPic} />
                ) : (
                  <View style={styles.modalAvatarInitials}>
                    <Text style={styles.modalAvatarLetter}>
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.verifiedIdentityPill}>
                  <Text style={styles.verifiedIdentityPillText}>✓ Google Verified Identity</Text>
                </View>
              </View>

              {saveMessage && <Text style={styles.saveAlertSuccess}>{saveMessage}</Text>}

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>FULL NAME</Text>
                <TextInput
                  style={styles.modalInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>EMAIL ADDRESS (NON-EDITABLE)</Text>
                <View style={styles.disabledInputRow}>
                  <TextInput
                    style={[styles.modalInput, styles.disabledInput]}
                    value={email}
                    editable={false}
                  />
                  <Text style={styles.lockBadge}>🔒</Text>
                </View>
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>PHONE NUMBER</Text>
                <TextInput
                  style={styles.modalInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 9876543210"
                  placeholderTextColor={THEME.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>GENDER</Text>
                <View style={styles.genderButtonRow}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderSelectBtn, gender === g && styles.genderSelectBtnActive]}
                      onPress={() => setGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderSelectText,
                          gender === g && styles.genderSelectTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalFieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.modalLabel}>DATE OF BIRTH (YYYY-MM-DD)</Text>
                  {calculatedAge !== null && (
                    <Text style={styles.ageAutoBadge}>Age: {calculatedAge} yrs (Auto)</Text>
                  )}
                </View>
                <TextInput
                  style={styles.modalInput}
                  value={dob}
                  onChangeText={handleDobChange}
                  placeholder="2000-05-15"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>HOME CITY / LOCATION</Text>
                <TextInput
                  style={styles.modalInput}
                  value={homeLocation}
                  onChangeText={setHomeLocation}
                  placeholder="e.g. New Delhi, India"
                  placeholderTextColor={THEME.textMuted}
                />
              </View>

              <TouchableOpacity
                style={styles.saveProfileBtn}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveProfileBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>Sign Out from TripSaathi</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Desktop outer backdrop (centers the phone)
  desktopBackdrop: {
    flex: 1,
    backgroundColor: '#EBE4DB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  // Top control bar for web preview
  desktopControlBar: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  desktopControlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopBrand: {
    fontFamily: SERIF_FONT,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  desktopModeTag: {
    fontSize: 11,
    color: THEME.textSecondary,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  desktopViewToggle: {
    backgroundColor: THEME.paper,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  desktopViewToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.text,
  },

  // The Phone Bezel Frame
  phoneFrameWrapper: {
    width: '100%',
    maxWidth: 412,
    height: Platform.OS === 'web' ? '92vh' : '100%',
    maxHeight: 860,
    backgroundColor: '#1E1B18', // Titanium bezel color
    borderRadius: 44,
    padding: 10,
    borderWidth: 2,
    borderColor: '#38332F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 20,
    overflow: 'hidden',
  },
  phoneContentContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: THEME.bg,
  },

  // Dynamic Island / Speaker notch
  phoneDynamicIsland: {
    height: 18,
    width: 90,
    backgroundColor: '#12100E',
    alignSelf: 'center',
    borderRadius: 10,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  phoneCameraDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A2622',
  },
  phoneSpeakerBar: {
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#2A2622',
  },

  // Inner Phone Screen Canvas
  phoneInnerCanvas: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderRadius: 34,
    overflow: 'hidden',
  },

  // Mobile Status Bar
  mobileStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
  },
  mobileStatusTime: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
  },
  mobileStatusIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  mobileStatusIconItem: {
    fontSize: 11,
  },

  // Mobile Header
  mobileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  appHeaderTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -0.3,
  },
  appHeaderSub: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: THEME.primary,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: THEME.green,
    borderWidth: 1.5,
    borderColor: THEME.bg,
  },
  headerDevBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerDevBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Incomplete profile banner
  incompleteProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.amberBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(194, 94, 26, 0.2)',
    gap: 8,
  },
  incompleteIcon: {
    fontSize: 13,
  },
  incompleteText: {
    flex: 1,
    fontSize: 11,
    color: THEME.amber,
    fontWeight: '600',
  },
  incompleteArrow: {
    fontSize: 14,
    color: THEME.amber,
    fontWeight: '700',
  },

  // Scroll Body
  screenScrollView: {
    flex: 1,
  },
  screenScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // Auth Card
  authCard: {
    backgroundColor: THEME.paper,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16,
    alignItems: 'center',
  },
  authKicker: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  authTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 17,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  authDesc: {
    fontSize: 11,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 14,
  },
  authBtnContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  googleBtnBox: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleNativeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0C9BE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    gap: 10,
    marginBottom: 4,
  },
  googleLogo: {
    width: 18,
    height: 18,
  },
  googleNativeBtnText: {
    color: '#1F1B18',
    fontSize: 13,
    fontWeight: '700',
  },
  fastDevBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: THEME.primaryLight,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
    borderRadius: 6,
  },
  fastDevBtnText: {
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '700',
  },

  // Active Screen Frame
  activeScreenBox: {
    width: '100%',
  },
  screenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  screenTitleSerif: {
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
    color: THEME.text,
  },
  screenStepBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.primary,
    backgroundColor: THEME.primaryLight,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  impactSubText: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 14,
  },

  // Form Fields (Add Trip)
  formGroup: {
    marginBottom: 12,
  },
  fieldKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.paper,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  airportCode: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.text,
  },
  cityName: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  inputRegularText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text,
  },
  inputIconRight: {
    fontSize: 13,
    color: THEME.textSecondary,
  },
  primaryTerracottaBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  primaryTerracottaBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Subtabs (Dashboard)
  subtabsRow: {
    flexDirection: 'row',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    paddingBottom: 6,
    marginBottom: 12,
  },
  subtabBtn: {
    paddingBottom: 4,
  },
  subtabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: THEME.primary,
  },
  subtabText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  subtabTextActive: {
    color: THEME.primary,
    fontWeight: '700',
  },

  routeBox: {
    backgroundColor: THEME.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 12,
  },
  routeTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 2,
  },
  routeDateText: {
    fontSize: 11,
    color: THEME.textSecondary,
  },

  // Segments
  segmentList: {
    gap: 8,
  },
  segmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 10,
    gap: 10,
  },
  segmentCardAlert: {
    borderColor: THEME.primary,
    backgroundColor: '#FFFBF9',
  },
  segmentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: THEME.paperSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentEmoji: {
    fontSize: 15,
  },
  segmentName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
  },
  segmentDetail: {
    fontSize: 10,
    color: THEME.textSecondary,
  },
  viewImpactHint: {
    fontSize: 9,
    color: THEME.primary,
    fontWeight: '700',
    marginTop: 2,
  },

  // Badges
  badgeGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.green,
    backgroundColor: THEME.greenBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeAmber: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.amber,
    backgroundColor: THEME.amberBg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeMuted: {
    fontSize: 10,
    color: THEME.textMuted,
    paddingHorizontal: 6,
  },

  // Impact View
  delayHeroCard: {
    backgroundColor: THEME.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.primaryBorder,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  delayHeroKicker: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  delayHeroTime: {
    fontFamily: SERIF_FONT,
    fontSize: 34,
    fontWeight: '800',
    color: THEME.primary,
    marginVertical: 2,
  },
  delayHeroLocation: {
    fontSize: 11,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  affectedHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  impactItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 8,
  },
  impactItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 2,
  },
  impactItemSub: {
    fontSize: 10,
    color: THEME.textSecondary,
  },

  // Recovery Options
  recoveryOptionCard: {
    backgroundColor: THEME.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 10,
  },
  recoveryOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recoveryOptionBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 0.5,
  },
  recoveryOptionTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  recoveryOptionDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: THEME.textSecondary,
    marginBottom: 10,
  },
  recoveryOptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.paperSubtle,
    paddingTop: 8,
  },
  recoveryTimeText: {
    fontSize: 10,
    color: THEME.textMuted,
  },
  approveActionBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveActionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  outlineActionBtn: {
    borderWidth: 1,
    borderColor: THEME.borderDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  outlineActionBtnText: {
    color: THEME.text,
    fontSize: 11,
    fontWeight: '600',
  },

  // Action Tracker
  trackerGroup: {
    backgroundColor: THEME.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 10,
  },
  trackerGroupHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  trackerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  trackerBullet: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  trackerBulletAmber: {
    fontSize: 12,
    color: THEME.amber,
  },
  trackerBulletDone: {
    fontSize: 12,
    color: THEME.green,
    fontWeight: '800',
  },
  trackerItemText: {
    fontSize: 11,
    color: THEME.text,
    flex: 1,
  },
  trackerItemDone: {
    color: THEME.textMuted,
    textDecorationLine: 'line-through',
  },
  scopeNoteBox: {
    backgroundColor: THEME.paperSubtle,
    borderWidth: 1,
    borderColor: THEME.borderDark,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  scopeNoteTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  scopeNoteBody: {
    fontSize: 10,
    color: THEME.textSecondary,
    lineHeight: 14,
  },

  // Bottom Navigation Bar
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.paper,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabBarItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    position: 'relative',
  },
  tabBarIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabBarIconActive: {
    opacity: 1,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  tabBarLabelActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
  activeIndicatorDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.primary,
  },

  // Home Indicator Bar
  homeIndicatorBar: {
    width: 120,
    height: 4,
    backgroundColor: '#D1C9BE',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 4,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 27, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: THEME.paper,
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: THEME.borderDark,
    overflow: 'hidden',
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  modalKicker: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.primary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  modalTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  closeModalBtn: {
    padding: 6,
  },
  closeModalBtnText: {
    fontSize: 15,
    color: THEME.textSecondary,
    fontWeight: '700',
  },
  modalScrollBody: {
    padding: 18,
  },
  modalAvatarBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAvatarPic: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: THEME.primary,
    marginBottom: 8,
  },
  modalAvatarInitials: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalAvatarLetter: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  verifiedIdentityPill: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primaryBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedIdentityPillText: {
    color: THEME.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  saveAlertSuccess: {
    backgroundColor: THEME.greenBg,
    borderColor: THEME.green,
    borderWidth: 1,
    color: THEME.green,
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 11,
    fontWeight: '600',
  },
  modalFieldGroup: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: THEME.paperSubtle,
    borderWidth: 1,
    borderColor: THEME.borderDark,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: THEME.text,
    fontSize: 13,
  },
  disabledInputRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  disabledInput: {
    backgroundColor: THEME.bgAlt,
    color: THEME.textMuted,
    paddingRight: 32,
  },
  lockBadge: {
    position: 'absolute',
    right: 10,
    fontSize: 12,
  },
  genderButtonRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: THEME.paperSubtle,
    borderWidth: 1,
    borderColor: THEME.borderDark,
  },
  genderSelectBtnActive: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primary,
  },
  genderSelectText: {
    color: THEME.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
  genderSelectTextActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
  ageAutoBadge: {
    color: THEME.green,
    fontSize: 10,
    fontWeight: '700',
  },
  saveProfileBtn: {
    backgroundColor: THEME.primary,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  saveProfileBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  signOutButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  signOutButtonText: {
    color: THEME.primary,
    fontWeight: '600',
    fontSize: 12,
  },
});

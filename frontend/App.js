import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

import { GOOGLE_CLIENT_ID } from './src/constants/theme';
import { authApi, userApi } from './src/services/api';
import { styles } from './src/styles/appStyles';

import Header from './src/components/Header';
import TabBar from './src/components/TabBar';
import AuthCard from './src/components/AuthCard';
import ProfileModal from './src/components/ProfileModal';

import AddTripScreen from './src/screens/AddTripScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ImpactScreen from './src/screens/ImpactScreen';
import RecoveryScreen from './src/screens/RecoveryScreen';
import TrackerScreen from './src/screens/TrackerScreen';

WebBrowser.maybeCompleteAuthSession();

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

      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `response_type=id_token&` +
        `redirect_uri=${encodeURIComponent(expoProxyRedirect)}&` +
        `scope=${encodeURIComponent('openid profile email')}&` +
        `nonce=${Math.random().toString(36).substring(2)}`;

      const proxyStartUrl = `https://auth.expo.io/@arnesh512/TripSaathi/start?authUrl=${encodeURIComponent(
        googleAuthUrl
      )}&returnUrl=${encodeURIComponent(returnUrl)}`;

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
      const res = await authApi.exchangeGoogleToken(googleJwt);
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
      const res = await userApi.getProfile(jwtToken);
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
      const res = await userApi.updateProfile(
        {
          name: name.trim(),
          phone_number: phone.trim(),
          gender,
          date_of_birth: dob.trim(),
          home_location: homeLocation.trim(),
        },
        token
      );
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
            <Header
              user={user}
              onOpenProfile={() => setProfileModalVisible(true)}
              onFastSignIn={() => exchangeGoogleTokenWithBackend('mock_google_token_dev')}
            />

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
                <AuthCard
                  loading={loading}
                  onMobileGoogleLogin={handleMobileGoogleLogin}
                  onFastSignIn={() => exchangeGoogleTokenWithBackend('mock_google_token_dev')}
                />
              )}

              {/* SCREENS */}
              {activeTab === 'ADD_TRIP' && (
                <AddTripScreen onAddTripSuccess={() => setActiveTab('DASHBOARD')} />
              )}

              {activeTab === 'DASHBOARD' && (
                <DashboardScreen
                  dashboardSubtab={dashboardSubtab}
                  setDashboardSubtab={setDashboardSubtab}
                  onViewImpact={() => setActiveTab('IMPACT')}
                />
              )}

              {activeTab === 'IMPACT' && (
                <ImpactScreen onNavigateToRecovery={() => setActiveTab('RECOVERY')} />
              )}

              {activeTab === 'RECOVERY' && (
                <RecoveryScreen onSelectRecoveryAction={() => setActiveTab('TRACKER')} />
              )}

              {activeTab === 'TRACKER' && <TrackerScreen />}
            </ScrollView>

            {/* BOTTOM NAVIGATION TAB BAR */}
            <TabBar activeTab={activeTab} onSelectTab={setActiveTab} />

            {/* HOME INDICATOR BAR (Mobile Bezel) */}
            <View style={styles.homeIndicatorBar} />
          </SafeAreaView>
        </View>

        {/* USER PROFILE MODAL */}
        <ProfileModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          user={user}
          name={name}
          setName={setName}
          email={email}
          phone={phone}
          setPhone={setPhone}
          gender={gender}
          setGender={setGender}
          dob={dob}
          handleDobChange={handleDobChange}
          calculatedAge={calculatedAge}
          homeLocation={homeLocation}
          setHomeLocation={setHomeLocation}
          savingProfile={savingProfile}
          saveMessage={saveMessage}
          onSaveProfile={handleSaveProfile}
          onSignOut={handleSignOut}
        />
      </View>
    </SafeAreaProvider>
  );
}

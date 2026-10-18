import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { authApi, userApi } from './src/services/api';
import {
  configureGoogleSignIn,
  initWebGoogleSignIn,
  signInWithGoogle,
  signOutFromGoogle,
} from './src/services/googleAuth';
import { styles } from './src/styles/appStyles';

import Header from './src/components/Header';
import TabBar from './src/components/TabBar';
import AuthCard from './src/components/AuthCard';
import ProfileModal from './src/components/ProfileModal';

import AddTripScreen from './src/screens/AddTripScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ImpactScreen from './src/screens/ImpactScreen';
import RecoveryScreen from './src/screens/RecoveryScreen';
import MonitorScreen from './src/screens/MonitorScreen';

export default function App() {
  const { width: windowWidth } = useWindowDimensions();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'ADD_TRIP' | 'MONITOR' | 'IMPACT' | 'RECOVERY'
  const [hasDelayAlert, setHasDelayAlert] = useState(false);
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

  // Initialize Google Sign-In per platform
  useEffect(() => {
    if (Platform.OS === 'web' && !token) {
      initWebGoogleSignIn(
        async (result) => {
          if (result?.idToken) {
            await exchangeGoogleTokenWithBackend(result.idToken);
          }
        },
        (errMsg) => {
          alertError(errMsg);
        }
      );
    } else if (Platform.OS !== 'web') {
      configureGoogleSignIn();
    }
  }, [token]);

  // Native Google Sign-In for Standalone Android / iOS
  const handleMobileGoogleLogin = async () => {
    if (loading) return; // Prevent duplicate sign-in requests
    try {
      setLoading(true);
      const result = await signInWithGoogle();
      if (result.cancelled || result.inProgress) {
        return;
      }
      if (result.error) {
        alertError(result.error);
        return;
      }
      if (result.idToken) {
        await exchangeGoogleTokenWithBackend(result.idToken);
      }
    } catch (err) {
      alertError('Google Sign In error: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
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

  const handleSignOut = async () => {
    try {
      await signOutFromGoogle();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
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
              <Image
                source={require('./assets/logo.png')}
                style={{ width: 22, height: 22, borderRadius: 5, marginRight: 6 }}
                resizeMode="cover"
              />
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
            {/* MOBILE APP HEADER: Shown on all pages before sign-in; after sign-in, appears only on DASHBOARD */}
            {(!user || activeTab === 'DASHBOARD') && (
              <Header
                user={user}
                onOpenProfile={() => setProfileModalVisible(true)}
                onGoogleSignIn={() => {
                  if (Platform.OS === 'web') {
                    if (window.google?.accounts?.id) {
                      window.google.accounts.id.prompt((notification) => {
                        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                          // Fallback to dev test login if GSI popup is blocked by browser/localhost
                          exchangeGoogleTokenWithBackend('mock_google_token_dev');
                        }
                      });
                    } else {
                      exchangeGoogleTokenWithBackend('mock_google_token_dev');
                    }
                  } else {
                    handleMobileGoogleLogin();
                  }
                }}
                onFastSignIn={() => exchangeGoogleTokenWithBackend('mock_google_token_dev')}
              />
            )}

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
              {/* SCREENS */}
              {activeTab === 'ADD_TRIP' && (
                <AddTripScreen
                  token={token}
                  onAddTripSuccess={() => setActiveTab('MONITOR')}
                />
              )}

              {activeTab === 'DASHBOARD' && (
                <DashboardScreen
                  token={token}
                  user={user}
                  dashboardSubtab={dashboardSubtab}
                  setDashboardSubtab={setDashboardSubtab}
                  onViewImpact={() => setActiveTab('IMPACT')}
                  onNavigateToAddTrip={() => setActiveTab('ADD_TRIP')}
                />
              )}

              {activeTab === 'MONITOR' && (
                <MonitorScreen
                  onViewImpact={() => setActiveTab('IMPACT')}
                  onNavigateToAddTrip={() => setActiveTab('ADD_TRIP')}
                  onTriggerDelayAlert={(active) => setHasDelayAlert(active)}
                  isDelayAlertActive={hasDelayAlert}
                />
              )}

              {activeTab === 'IMPACT' && (
                <ImpactScreen onNavigateToRecovery={() => setActiveTab('RECOVERY')} />
              )}

              {activeTab === 'RECOVERY' && (
                <RecoveryScreen />
              )}
            </ScrollView>

            {/* BOTTOM NAVIGATION TAB BAR */}
            <TabBar activeTab={activeTab} onSelectTab={setActiveTab} hasImpactAlert={hasDelayAlert} />

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

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

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

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
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 280,
        });
      }
    }
  };

  // Callback when Google Sign-In succeeds
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    await exchangeGoogleTokenWithBackend(response.credential);
  };

  // Sends Google ID Token to FastAPI backend (/auth/google)
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
        // Load full user profile from backend
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

  // Fetch user profile from /user/profile
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

  // Calculate age automatically on DOB change
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

  // Save profile to /user/profile (PUT)
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
      Alert.alert('Error', msg);
    }
  };

  const isProfileIncomplete = user && (!user.phone_number || !user.date_of_birth || !user.home_location);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandEmoji}>✈️</Text>
          <Text style={styles.brandText}>TripSaathi</Text>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>AI Travel</Text>
          </View>
        </View>

        {user && (
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
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* LOGGED OUT STATE */}
        {!token ? (
          <View style={styles.authContainer}>
            <View style={styles.heroBox}>
              <Text style={styles.heroTitle}>Your AI Travel Companion</Text>
              <Text style={styles.heroSubtitle}>
                Discover flights, compare airline cancellation rules, and automate your travel itinerary seamlessly.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeader}>Sign in to TripSaathi</Text>
              <Text style={styles.cardSub}>Sign in with Google to manage your bookings and profile.</Text>

              {loading ? (
                <ActivityIndicator size="large" color="#0284c7" style={{ marginVertical: 20 }} />
              ) : (
                <View style={styles.loginActionsContainer}>
                  {/* Web Official Google Button Container */}
                  <View id="googleSignInBtn" style={styles.googleBtnContainer} />

                  {/* Fallback & Quick Test login button */}
                  <TouchableOpacity
                    style={styles.quickDevBtn}
                    onPress={() => exchangeGoogleTokenWithBackend('mock_google_token_dev')}
                  >
                    <Text style={styles.quickDevBtnText}>⚡ Fast Test Login (Developer Mode)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* LOGGED IN DASHBOARD */
          <View style={styles.dashboardContainer}>
            {/* User Greeting Card */}
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeInfo}>
                <Text style={styles.welcomeTitle}>Welcome, {user?.name || 'Explorer'}!</Text>
                <Text style={styles.welcomeEmail}>{user?.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewProfileBtn}
                onPress={() => setProfileModalVisible(true)}
              >
                <Text style={styles.viewProfileBtnText}>View Profile 👤</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Completion Prompt */}
            {isProfileIncomplete && (
              <View style={styles.promptBanner}>
                <Text style={styles.promptIcon}>ℹ️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.promptTitle}>Complete your traveler profile</Text>
                  <Text style={styles.promptDesc}>
                    Add your phone number, date of birth, and home city for automated flight booking.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.promptActionBtn}
                  onPress={() => setProfileModalVisible(true)}
                >
                  <Text style={styles.promptActionBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Feature Cards Grid */}
            <Text style={styles.sectionHeading}>Travel Intelligence Hub</Text>
            <View style={styles.grid}>
              <View style={styles.featureCard}>
                <Text style={styles.featureEmoji}>🛫</Text>
                <Text style={styles.featureTitle}>Flight Search</Text>
                <Text style={styles.featureDesc}>
                  Autonomous Mako AI agent searches lowest fares across IndiGo, Air India, & major airlines.
                </Text>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureEmoji}>📜</Text>
                <Text style={styles.featureTitle}>Cancellation Intelligence</Text>
                <Text style={styles.featureDesc}>
                  Extracts live 24-hr risk-free refund rules and fee policies across top carriers.
                </Text>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureEmoji}>🔗</Text>
                <Text style={styles.featureTitle}>1-Click Deep Links</Text>
                <Text style={styles.featureDesc}>
                  Pre-fills booking params directly into Uber, Booking.com, and ConfirmTkt.
                </Text>
              </View>

              <View style={styles.featureCard}>
                <Text style={styles.featureEmoji}>🏨</Text>
                <Text style={styles.featureTitle}>Hotel Reservations</Text>
                <Text style={styles.featureDesc}>
                  Reserve hotels with 'Pay at Property' options without payment friction.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* USER PROFILE MODAL */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Traveler Profile</Text>
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
                <Text style={styles.modalEmailBadge}>Google Authenticated</Text>
              </View>

              {saveMessage && <Text style={styles.successBanner}>{saveMessage}</Text>}

              {/* Form Fields */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your full name"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address (Non-Editable)</Text>
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
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 9876543210"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Gender</Text>
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.fieldLabel}>Date of Birth (YYYY-MM-DD)</Text>
                  {calculatedAge !== null && (
                    <Text style={styles.ageBadge}>Age: {calculatedAge} yrs (Auto)</Text>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  value={dob}
                  onChangeText={handleDobChange}
                  placeholder="2000-05-15"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Home City / Location</Text>
                <TextInput
                  style={styles.input}
                  value={homeLocation}
                  onChangeText={setHomeLocation}
                  placeholder="e.g. New Delhi, India"
                  placeholderTextColor="#64748b"
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
                <Text style={styles.signOutBtnText}>Sign Out</Text>
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
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandEmoji: {
    fontSize: 24,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  badgeContainer: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderColor: '#0284c7',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#0284c7',
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284c7',
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
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  authContainer: {
    width: '100%',
    maxWidth: 480,
    marginTop: 20,
  },
  heroBox: {
    marginBottom: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#131c2e',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 13,
    color: '#94a3b8',
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
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickDevBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  dashboardContainer: {
    width: '100%',
    maxWidth: 800,
  },
  welcomeCard: {
    backgroundColor: '#131c2e',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  welcomeEmail: {
    fontSize: 13,
    color: '#94a3b8',
  },
  viewProfileBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  viewProfileBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  promptBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  promptIcon: {
    fontSize: 22,
  },
  promptTitle: {
    color: '#fbbf24',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },
  promptDesc: {
    color: '#fef3c7',
    fontSize: 12,
  },
  promptActionBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  promptActionBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#131c2e',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 240,
  },
  featureEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '700',
  },
  modalScroll: {
    padding: 20,
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
    borderColor: '#0284c7',
    marginBottom: 8,
  },
  modalAvatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalAvatarFallbackText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  modalEmailBadge: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  successBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    color: '#34d399',
    padding: 10,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 13,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
  },
  disabledInputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  disabledInput: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    color: '#94a3b8',
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
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  genderBtnActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderColor: '#0284c7',
  },
  genderBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13,
  },
  genderBtnTextActive: {
    color: '#38bdf8',
  },
  ageBadge: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  signOutBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 13,
  },
});

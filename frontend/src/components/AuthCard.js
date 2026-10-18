import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { styles } from '../styles/appStyles';
import { THEME } from '../constants/theme';

export default function AuthCard({ loading, onMobileGoogleLogin, onFastSignIn }) {
  return (
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
              onPress={onMobileGoogleLogin}
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
            onPress={onFastSignIn}
          >
            <Text style={styles.fastDevBtnText}>⚡ One-Tap Fast Developer Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

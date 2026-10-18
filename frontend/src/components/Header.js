import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from '../styles/appStyles';

export default function Header({ user, onOpenProfile, onGoogleSignIn, onFastSignIn }) {
  return (
    <View style={styles.mobileHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 38, height: 38, borderRadius: 8 }}
          resizeMode="cover"
        />
        <View>
          <Text style={styles.appHeaderTitle}>TripSaathi</Text>
          <Text style={styles.appHeaderSub}>Connected Travel Recovery</Text>
        </View>
      </View>

      {user ? (
        <TouchableOpacity
          style={styles.avatarTouchable}
          onPress={onOpenProfile}
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
          style={styles.headerGoogleBtn}
          onPress={onGoogleSignIn}
          onLongPress={onFastSignIn}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
            style={styles.headerGoogleLogo}
          />
          <Text style={styles.headerGoogleBtnText}>Sign In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

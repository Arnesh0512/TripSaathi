import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from '../styles/appStyles';

export default function Header({ user, onOpenProfile, onFastSignIn }) {
  return (
    <View style={styles.mobileHeader}>
      <View>
        <Text style={styles.appHeaderTitle}>TripSaathi</Text>
        <Text style={styles.appHeaderSub}>Connected Travel Recovery</Text>
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
          style={styles.headerDevBtn}
          onPress={onFastSignIn}
        >
          <Text style={styles.headerDevBtnText}>⚡ Sign In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

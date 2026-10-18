import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { styles } from '../styles/appStyles';
import { THEME } from '../constants/theme';

export default function ProfileModal({
  visible,
  onClose,
  user,
  name,
  setName,
  email,
  phone,
  setPhone,
  gender,
  setGender,
  dob,
  handleDobChange,
  calculatedAge,
  homeLocation,
  setHomeLocation,
  savingProfile,
  saveMessage,
  onSaveProfile,
  onSignOut,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalTopBar}>
            <View>
              <Text style={styles.modalKicker}>TRIPSAATHI ID</Text>
              <Text style={styles.modalTitle}>Traveler Profile</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeModalBtn}>
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
              onPress={onSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveProfileBtnText}>Save Profile Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutButton} onPress={onSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out from TripSaathi</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/appStyles';

export default function AddTripScreen({ onAddTripSuccess }) {
  return (
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
        onPress={onAddTripSuccess}
      >
        <Text style={styles.primaryTerracottaBtnText}>Add Trip</Text>
      </TouchableOpacity>
    </View>
  );
}

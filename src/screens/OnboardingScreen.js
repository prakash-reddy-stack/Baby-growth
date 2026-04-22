import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { insertBaby, getDb } from '../database/db';
import { SWEDEN_VACCINES } from '../constants/swedenVaccineSchedule';
import { useBaby } from '../context/BabyContext';
import { requestNotificationPermissions } from '../utils/notifications';

export default function OnboardingScreen({ navigation }) {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const { refreshAll } = useBaby();

  const handleCreate = async () => {
    if (!name.trim() || !dob.trim()) {
      Alert.alert('Required', 'Please enter baby name and date of birth.');
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dob)) {
      Alert.alert('Invalid Date', 'Please use format YYYY-MM-DD');
      return;
    }

    try {
      const babyId = await insertBaby(name.trim(), dob.trim(), gender, null);

      // Seed Sweden vaccine schedule
      const d = await getDb();
      for (const v of SWEDEN_VACCINES) {
        await d.runAsync(
          'INSERT INTO vaccinations (baby_id, vaccine_name, scheduled_age_weeks, is_custom) VALUES (?,?,?,0)',
          [babyId, v.vaccine_name, v.scheduled_age_weeks]
        );
      }

      await requestNotificationPermissions();
      await refreshAll();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.emoji}>👶</Text>
      <Text style={styles.title}>Welcome to Baby Growth</Text>
      <Text style={styles.subtitle}>Let's set up your baby's profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Baby's Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Emma"
          placeholderTextColor={Colors.textLight}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2024-01-15"
          placeholderTextColor={Colors.textLight}
          value={dob}
          onChangeText={setDob}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          {['Girl', 'Boy', 'Other'].map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                {g === 'Girl' ? '👧' : g === 'Boy' ? '👦' : '🌟'} {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleCreate}>
        <Text style={styles.btnText}>Create Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, alignItems: 'center', padding: 24, paddingTop: 60 },
  emoji: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8, marginBottom: 32 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, width: '100%', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background },
  genderRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  genderBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 10, alignItems: 'center' },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF0F5' },
  genderText: { fontSize: 13, color: Colors.textSecondary },
  genderTextActive: { color: Colors.primaryDark, fontWeight: '600' },
  btn: { marginTop: 28, backgroundColor: Colors.primaryDark, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

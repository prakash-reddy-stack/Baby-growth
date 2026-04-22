import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useBaby } from '../context/BabyContext';
import { updateBaby, insertBaby, getDb } from '../database/db';
import { SWEDEN_VACCINES } from '../constants/swedenVaccineSchedule';
import { cancelFeedingReminder } from '../utils/notifications';

export default function SettingsScreen() {
  const { baby, refreshAll } = useBaby();
  const [editVisible, setEditVisible] = useState(false);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setName(baby?.name || '');
    setDob(baby?.dob || '');
    setGender(baby?.gender || '');
    setEditVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !dob.trim()) { Alert.alert('Required', 'Name and date of birth are required.'); return; }
    setSaving(true);
    try {
      if (baby?.id) {
        await updateBaby(baby.id, name.trim(), dob.trim(), gender, baby.photo_uri);
      } else {
        const babyId = await insertBaby(name.trim(), dob.trim(), gender, null);
        const d = await getDb();
        for (const v of SWEDEN_VACCINES) {
          await d.runAsync(
            'INSERT INTO vaccinations (baby_id, vaccine_name, scheduled_age_weeks, is_custom) VALUES (?,?,?,0)',
            [babyId, v.vaccine_name, v.scheduled_age_weeks]
          );
        }
      }
      await refreshAll();
      setEditVisible(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReminders = async () => {
    Alert.alert('Cancel Reminders', 'Turn off all feeding reminders?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: async () => { await cancelFeedingReminder(); Alert.alert('Done', 'Feeding reminders turned off.'); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Baby profile */}
        <Text style={styles.sectionTitle}>Baby Profile</Text>
        <View style={styles.card}>
          <View style={styles.babyRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{baby?.gender === 'Girl' ? '👧' : baby?.gender === 'Boy' ? '👦' : '👶'}</Text>
            </View>
            <View style={styles.babyInfo}>
              <Text style={styles.babyName}>{baby?.name || '—'}</Text>
              <Text style={styles.babyDob}>Born: {baby?.dob || '—'}</Text>
              <Text style={styles.babyGender}>{baby?.gender || 'Gender not set'}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <TouchableOpacity style={styles.actionRow} onPress={handleCancelReminders}>
          <Text style={styles.actionEmoji}>🔕</Text>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Turn Off Feeding Reminders</Text>
            <Text style={styles.actionSub}>Cancel all scheduled feeding notifications</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>App Name</Text>
            <Text style={styles.aboutValue}>Baby Growth</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Vaccine Schedule</Text>
            <Text style={styles.aboutValue}>Sweden (Socialstyrelsen)</Text>
          </View>
          <View style={[styles.aboutRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.aboutLabel}>Growth Charts</Text>
            <Text style={styles.aboutValue}>WHO 0–24 months</Text>
          </View>
        </View>
      </ScrollView>

      {/* Edit Baby Modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Baby Profile</Text>

            <Text style={styles.label}>Name *</Text>
            <TextInput style={styles.input} placeholder="Baby's name" placeholderTextColor={Colors.textLight} value={name} onChangeText={setName} />

            <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="e.g. 2024-01-15" placeholderTextColor={Colors.textLight} value={dob} onChangeText={setDob} keyboardType="numeric" />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {['Girl', 'Boy', 'Other'].map(g => (
                <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.genderBtnActive]} onPress={() => setGender(g)}>
                  <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g === 'Girl' ? '👧' : g === 'Boy' ? '👦' : '🌟'} {g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.6 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  babyRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF0F5', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarEmoji: { fontSize: 28 },
  babyInfo: { flex: 1 },
  babyName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  babyDob: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  babyGender: { fontSize: 12, color: Colors.textLight, marginTop: 1 },
  editBtn: { backgroundColor: '#FFF0F5', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14 },
  editBtnText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 13 },
  actionRow: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  actionEmoji: { fontSize: 24 },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  actionSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  actionArrow: { fontSize: 20, color: Colors.textLight },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  aboutLabel: { fontSize: 14, color: Colors.textSecondary },
  aboutValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 10, alignItems: 'center' },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF0F5' },
  genderText: { fontSize: 13, color: Colors.textSecondary },
  genderTextActive: { color: Colors.primaryDark, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: Colors.primaryDark, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

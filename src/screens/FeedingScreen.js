import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, Switch,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useBaby } from '../context/BabyContext';
import { insertFeeding, deleteFeeding } from '../database/db';
import { scheduleFeedingReminder, cancelFeedingReminder } from '../utils/notifications';
import { format, parseISO } from 'date-fns';

export default function FeedingScreen() {
  const { baby, feedings, refreshFeedings } = useBaby();
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState('formula');
  const [amountMl, setAmountMl] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderHours, setReminderHours] = useState('3');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!baby) return;
    setSaving(true);
    try {
      await insertFeeding(
        baby.id,
        type,
        amountMl ? parseFloat(amountMl) : null,
        durationMin ? parseFloat(durationMin) : null,
        new Date().toISOString(),
        notes.trim() || null
      );

      if (reminderOn) {
        await scheduleFeedingReminder(parseFloat(reminderHours) || 3, baby.name);
      }

      await refreshFeedings(baby.id);
      setModalVisible(false);
      resetForm();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setType('formula');
    setAmountMl('');
    setDurationMin('');
    setNotes('');
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this feeding entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteFeeding(id);
          await refreshFeedings(baby.id);
        }
      },
    ]);
  };

  const grouped = feedings.reduce((acc, f) => {
    const day = format(parseISO(f.logged_at), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(f);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Feeding Log</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {Object.keys(grouped).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍼</Text>
            <Text style={styles.emptyText}>No feedings logged yet</Text>
          </View>
        )}

        {Object.keys(grouped).map(day => (
          <View key={day}>
            <Text style={styles.dayHeader}>{format(new Date(day), 'EEEE, dd MMM yyyy')}</Text>
            <View style={styles.card}>
              {grouped[day].map((f, idx) => (
                <View key={f.id} style={[styles.row, idx < grouped[day].length - 1 && styles.rowBorder]}>
                  <Text style={styles.rowEmoji}>{f.type === 'breastfeed' ? '🤱' : '🍼'}</Text>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowType}>{f.type === 'breastfeed' ? 'Breastfeed' : 'Formula'}</Text>
                    <Text style={styles.rowTime}>{format(parseISO(f.logged_at), 'HH:mm')}</Text>
                    {f.notes ? <Text style={styles.rowNotes}>{f.notes}</Text> : null}
                  </View>
                  <View style={styles.rowRight}>
                    {f.amount_ml ? <Text style={styles.rowAmount}>{f.amount_ml} ml</Text> : null}
                    {f.duration_min ? <Text style={styles.rowAmount}>{f.duration_min} min</Text> : null}
                    <TouchableOpacity onPress={() => handleDelete(f.id)}>
                      <Text style={styles.deleteBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add Feeding Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Log Feeding</Text>

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              {[['formula', '🍼 Formula'], ['breastfeed', '🤱 Breastfeed']].map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.typeBtn, type === val && styles.typeBtnActive]}
                  onPress={() => setType(val)}
                >
                  <Text style={[styles.typeBtnText, type === val && styles.typeBtnTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {type === 'formula' ? (
              <>
                <Text style={styles.label}>Amount (ml)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 120"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={amountMl}
                  onChangeText={setAmountMl}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 15"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={durationMin}
                  onChangeText={setDurationMin}
                />
              </>
            )}

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Any notes..."
              placeholderTextColor={Colors.textLight}
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.reminderRow}>
              <Text style={styles.label}>Next feeding reminder</Text>
              <Switch
                value={reminderOn}
                onValueChange={setReminderOn}
                trackColor={{ true: Colors.primary }}
              />
            </View>
            {reminderOn && (
              <View style={styles.intervalRow}>
                <Text style={styles.intervalLabel}>Remind after</Text>
                {['2', '3', '4'].map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.intervalBtn, reminderHours === h && styles.intervalBtnActive]}
                    onPress={() => setReminderHours(h)}
                  >
                    <Text style={[styles.intervalText, reminderHours === h && styles.intervalTextActive]}>{h}h</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); resetForm(); }}>
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
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primaryDark, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textSecondary, marginTop: 12, fontSize: 15 },
  dayHeader: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowEmoji: { fontSize: 24, marginRight: 12 },
  rowInfo: { flex: 1 },
  rowType: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  rowTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  rowNotes: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowAmount: { fontSize: 13, fontWeight: '600', color: Colors.primaryDark },
  deleteBtn: { color: Colors.textLight, fontSize: 14, padding: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, alignItems: 'center' },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF0F5' },
  typeBtnText: { fontSize: 14, color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.primaryDark, fontWeight: '700' },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  intervalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  intervalLabel: { fontSize: 13, color: Colors.textSecondary, marginRight: 4 },
  intervalBtn: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14 },
  intervalBtnActive: { borderColor: Colors.primaryDark, backgroundColor: '#FFF0F5' },
  intervalText: { fontSize: 13, color: Colors.textSecondary },
  intervalTextActive: { color: Colors.primaryDark, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: Colors.primaryDark, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

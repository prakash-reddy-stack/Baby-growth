import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useBaby } from '../context/BabyContext';
import { markVaccinationDone, insertVaccination, deleteVaccination } from '../database/db';
import { scheduleVaccineReminder } from '../utils/notifications';
import { format, parseISO, addWeeks } from 'date-fns';

export default function VaccinationScreen() {
  const { baby, vaccinations, refreshVaccinations } = useBaby();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [doneModalVisible, setDoneModalVisible] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [customName, setCustomName] = useState('');
  const [adminDate, setAdminDate] = useState('');
  const [location, setLocation] = useState('');
  const [vacNotes, setVacNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');

  const done = vaccinations.filter(v => !!v.administered_at);
  const pending = vaccinations.filter(v => !v.administered_at);

  const filtered = filter === 'done' ? done : filter === 'pending' ? pending : vaccinations;

  const openDoneModal = (vaccine) => {
    setSelectedVaccine(vaccine);
    setAdminDate(format(new Date(), 'yyyy-MM-dd'));
    setLocation('');
    setVacNotes('');
    setDoneModalVisible(true);
  };

  const handleMarkDone = async () => {
    if (!adminDate) { Alert.alert('Required', 'Enter the date given.'); return; }
    setSaving(true);
    try {
      await markVaccinationDone(selectedVaccine.id, adminDate, location.trim() || null, vacNotes.trim() || null);
      await refreshVaccinations(baby.id);
      setDoneModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustom = async () => {
    if (!customName.trim()) { Alert.alert('Required', 'Enter vaccine name.'); return; }
    setSaving(true);
    try {
      await insertVaccination(baby.id, customName.trim(), null, adminDate || null, location.trim() || null, vacNotes.trim() || null, 1);
      await refreshVaccinations(baby.id);
      setAddModalVisible(false);
      setCustomName(''); setAdminDate(''); setLocation(''); setVacNotes('');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this vaccination record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteVaccination(id); await refreshVaccinations(baby.id); } },
    ]);
  };

  const getScheduledDate = (ageWeeks) => {
    if (!baby?.dob || ageWeeks == null) return null;
    return addWeeks(parseISO(baby.dob), ageWeeks);
  };

  const getWeekLabel = (weeks) => {
    if (weeks == null) return '';
    if (weeks === 0) return 'At birth';
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''}`;
    const m = Math.round(weeks / 4.33);
    return `${m} month${m > 1 ? 's' : ''}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Vaccinations</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setAdminDate(''); setCustomName(''); setLocation(''); setVacNotes(''); setAddModalVisible(true); }}>
            <Text style={styles.addBtnText}>+ Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Vaccination Progress</Text>
            <Text style={styles.progressCount}>{done.length}/{vaccinations.length}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${vaccinations.length ? (done.length / vaccinations.length) * 100 : 0}%` }]} />
          </View>
          <Text style={styles.progressSub}>{pending.length} remaining</Text>
        </View>

        {/* Filter tabs */}
        <View style={styles.tabs}>
          {[['all', 'All'], ['pending', 'Pending'], ['done', 'Done']].map(([val, lbl]) => (
            <TouchableOpacity key={val} style={[styles.tab, filter === val && styles.tabActive]} onPress={() => setFilter(val)}>
              <Text style={[styles.tabText, filter === val && styles.tabTextActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vaccine list */}
        {filtered.map((v) => {
          const scheduledDate = getScheduledDate(v.scheduled_age_weeks);
          const isPast = scheduledDate && scheduledDate < new Date() && !v.administered_at;
          return (
            <View key={v.id} style={[styles.vaccineCard, v.administered_at && styles.vaccineCardDone, isPast && styles.vaccineCardOverdue]}>
              <View style={styles.vaccineLeft}>
                <Text style={styles.vaccineStatus}>{v.administered_at ? '✅' : isPast ? '⚠️' : '⏳'}</Text>
              </View>
              <View style={styles.vaccineInfo}>
                <Text style={styles.vaccineName}>{v.vaccine_name}</Text>
                {v.scheduled_age_weeks != null && (
                  <Text style={styles.vaccineAge}>
                    {getWeekLabel(v.scheduled_age_weeks)}
                    {scheduledDate ? ` · ${format(scheduledDate, 'dd MMM yyyy')}` : ''}
                  </Text>
                )}
                {v.administered_at && (
                  <Text style={styles.vaccineDone}>
                    Given: {format(parseISO(v.administered_at), 'dd MMM yyyy')}
                    {v.location ? ` · ${v.location}` : ''}
                  </Text>
                )}
                {v.is_custom ? <Text style={styles.customBadge}>Custom</Text> : null}
              </View>
              <View style={styles.vaccineActions}>
                {!v.administered_at && (
                  <TouchableOpacity style={styles.doneBtn} onPress={() => openDoneModal(v)}>
                    <Text style={styles.doneBtnText}>Mark Done</Text>
                  </TouchableOpacity>
                )}
                {v.is_custom ? (
                  <TouchableOpacity onPress={() => handleDelete(v.id)}>
                    <Text style={styles.deleteBtn}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Mark as Done Modal */}
      <Modal visible={doneModalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Mark as Given</Text>
            <Text style={styles.modalSub}>{selectedVaccine?.vaccine_name}</Text>

            <Text style={styles.label}>Date Given (YYYY-MM-DD) *</Text>
            <TextInput style={styles.input} placeholder={format(new Date(), 'yyyy-MM-dd')} placeholderTextColor={Colors.textLight} value={adminDate} onChangeText={setAdminDate} />

            <Text style={styles.label}>Location / Clinic</Text>
            <TextInput style={styles.input} placeholder="e.g. BVC Solna" placeholderTextColor={Colors.textLight} value={location} onChangeText={setLocation} />

            <Text style={styles.label}>Notes</Text>
            <TextInput style={styles.input} placeholder="Any reactions or notes..." placeholderTextColor={Colors.textLight} value={vacNotes} onChangeText={setVacNotes} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDoneModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleMarkDone} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Custom Vaccine Modal */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Custom Vaccine</Text>

            <Text style={styles.label}>Vaccine Name *</Text>
            <TextInput style={styles.input} placeholder="e.g. Flu shot" placeholderTextColor={Colors.textLight} value={customName} onChangeText={setCustomName} />

            <Text style={styles.label}>Date Given (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} placeholder="Leave blank if not given yet" placeholderTextColor={Colors.textLight} value={adminDate} onChangeText={setAdminDate} />

            <Text style={styles.label}>Location / Clinic</Text>
            <TextInput style={styles.input} placeholder="e.g. BVC Solna" placeholderTextColor={Colors.textLight} value={location} onChangeText={setLocation} />

            <Text style={styles.label}>Notes</Text>
            <TextInput style={styles.input} placeholder="Any notes..." placeholderTextColor={Colors.textLight} value={vacNotes} onChangeText={setVacNotes} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddCustom} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Add'}</Text>
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
  progressCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  progressCount: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark },
  progressBar: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: Colors.success, borderRadius: 5 },
  progressSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', backgroundColor: Colors.surface },
  tabActive: { backgroundColor: '#FFF0F5', borderWidth: 1.5, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primaryDark },
  vaccineCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  vaccineCardDone: { backgroundColor: '#F0FFF8' },
  vaccineCardOverdue: { backgroundColor: '#FFF8E0', borderLeftWidth: 3, borderLeftColor: '#FFB800' },
  vaccineLeft: { marginRight: 12 },
  vaccineStatus: { fontSize: 22 },
  vaccineInfo: { flex: 1 },
  vaccineName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 3 },
  vaccineAge: { fontSize: 12, color: Colors.textSecondary },
  vaccineDone: { fontSize: 12, color: '#2D6A4F', marginTop: 2 },
  customBadge: { fontSize: 10, color: Colors.primaryDark, backgroundColor: '#FFF0F5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  vaccineActions: { alignItems: 'flex-end', gap: 6 },
  doneBtn: { backgroundColor: Colors.primaryDark, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12 },
  doneBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  deleteBtn: { color: Colors.textLight, fontSize: 14, padding: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  modalSub: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: Colors.primaryDark, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

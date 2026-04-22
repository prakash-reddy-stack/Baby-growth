import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Share, Modal,
} from 'react-native';
import { Colors } from '../constants/colors';
import { insertUser, getUsers, deleteUser } from '../database/db';

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function DoctorAccessScreen() {
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await getUsers();
    setUsers(data.filter(u => u.role === 'doctor'));
  };

  const openModal = () => {
    setDoctorName('');
    setGeneratedCode(generateCode());
    setModalVisible(true);
  };

  const handleCreate = async () => {
    if (!doctorName.trim()) { Alert.alert('Required', 'Enter doctor\'s name.'); return; }
    setSaving(true);
    try {
      await insertUser(doctorName.trim(), 'doctor', generatedCode);
      await loadUsers();
      setModalVisible(false);
      Alert.alert(
        'Invite Code Created',
        `Share this code with ${doctorName.trim()}:\n\n${generatedCode}\n\nThey can use this to access the baby's records in view-only mode.`,
        [
          { text: 'Share', onPress: () => handleShare(generatedCode, doctorName.trim()) },
          { text: 'Done', style: 'cancel' },
        ]
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async (code, name) => {
    await Share.share({
      message: `You've been granted view-only access to baby health records.\n\nYour access code: ${code}\n\nOpen the Baby Growth app and enter this code under "Doctor Access".`,
      title: `Baby Health Access Code for Dr. ${name}`,
    });
  };

  const handleRevoke = (user) => {
    Alert.alert('Revoke Access', `Remove access for ${user.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => { await deleteUser(user.id); await loadUsers(); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Doctor Access</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openModal}>
            <Text style={styles.addBtnText}>+ Invite</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>🔒</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>View-only access</Text>
            <Text style={styles.infoSub}>
              Doctors receive a unique invite code to access your baby's records. They can view all data but cannot make changes.
            </Text>
          </View>
        </View>

        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👨‍⚕️</Text>
            <Text style={styles.emptyText}>No doctor access granted yet</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Active Access</Text>
            {users.map(u => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>👨‍⚕️</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <View style={styles.codeRow}>
                    <Text style={styles.codeLabel}>Code: </Text>
                    <Text style={styles.codeValue}>{u.invite_code}</Text>
                  </View>
                  <Text style={styles.userDate}>Added {u.created_at?.split('T')[0]}</Text>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={() => handleShare(u.invite_code, u.name)}
                  >
                    <Text style={styles.shareBtnText}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRevoke(u)}>
                    <Text style={styles.revokeBtn}>Revoke</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Invite Doctor / Pediatrician</Text>

            <Text style={styles.label}>Doctor's Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Dr. Svensson"
              placeholderTextColor={Colors.textLight}
              value={doctorName}
              onChangeText={setDoctorName}
            />

            <Text style={styles.label}>Generated Invite Code</Text>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeDisplayText}>{generatedCode}</Text>
              <TouchableOpacity onPress={() => setGeneratedCode(generateCode())}>
                <Text style={styles.refreshCode}>↻ Refresh</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.codeHint}>Share this code with the doctor. They'll use it for view-only access.</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreate} disabled={saving}>
                <Text style={styles.saveText}>{saving ? 'Creating...' : 'Create & Share'}</Text>
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
  infoCard: { backgroundColor: '#EFF8FF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  infoEmoji: { fontSize: 24 },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.secondary },
  infoSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textSecondary, marginTop: 12, fontSize: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  userCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF8FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userAvatarText: { fontSize: 24 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  codeLabel: { fontSize: 12, color: Colors.textSecondary },
  codeValue: { fontSize: 13, fontWeight: '700', color: Colors.primaryDark, letterSpacing: 1 },
  userDate: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  userActions: { alignItems: 'flex-end', gap: 6 },
  shareBtn: { backgroundColor: Colors.secondary, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12 },
  shareBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  revokeBtn: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background },
  codeDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF0F5', borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: Colors.primary },
  codeDisplayText: { fontSize: 20, fontWeight: '700', color: Colors.primaryDark, letterSpacing: 3 },
  refreshCode: { fontSize: 13, color: Colors.textSecondary },
  codeHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: Colors.primaryDark, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

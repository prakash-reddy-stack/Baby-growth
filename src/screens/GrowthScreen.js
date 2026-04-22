import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../constants/colors';
import { useBaby } from '../context/BabyContext';
import { insertGrowth, deleteGrowth } from '../database/db';
import { WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS } from '../constants/whoChartData';
import { format, parseISO, differenceInMonths } from 'date-fns';

const W = Dimensions.get('window').width;

export default function GrowthScreen() {
  const { baby, growthRecords, refreshGrowth } = useBaby();
  const [modalVisible, setModalVisible] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  const whoData = baby?.gender === 'Girl' ? WHO_WEIGHT_GIRLS : WHO_WEIGHT_BOYS;

  const chartData = useMemo(() => {
    if (growthRecords.length === 0) return null;
    const labels = growthRecords.map(r => {
      const m = differenceInMonths(parseISO(r.recorded_at), parseISO(baby.dob));
      return `${m}m`;
    });
    const weights = growthRecords.map(r => r.weight_kg || 0);
    const p50 = growthRecords.map(r => {
      const m = differenceInMonths(parseISO(r.recorded_at), parseISO(baby.dob));
      const closest = whoData.reduce((a, b) => Math.abs(b.month - m) < Math.abs(a.month - m) ? b : a);
      return closest.p50;
    });

    return {
      labels,
      datasets: [
        { data: weights, color: () => Colors.primaryDark, strokeWidth: 2 },
        { data: p50, color: () => Colors.secondary, strokeWidth: 1.5, strokeDasharray: [5, 5] },
      ],
      legend: ["Baby's weight", 'WHO 50th percentile'],
    };
  }, [growthRecords, baby, whoData]);

  const handleSave = async () => {
    if (!baby || (!weight && !height && !head)) {
      Alert.alert('Required', 'Enter at least one measurement.');
      return;
    }
    setSaving(true);
    try {
      await insertGrowth(
        baby.id,
        weight ? parseFloat(weight) : null,
        height ? parseFloat(height) : null,
        head ? parseFloat(head) : null,
        new Date().toISOString(),
        notes.trim() || null
      );
      await refreshGrowth(baby.id);
      setModalVisible(false);
      setWeight(''); setHeight(''); setHead(''); setNotes('');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this record?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteGrowth(id); await refreshGrowth(baby.id); } },
    ]);
  };

  const latestRecord = growthRecords.length ? growthRecords[growthRecords.length - 1] : null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Growth & Weight</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Latest stats */}
        {latestRecord && (
          <View style={styles.latestCard}>
            <Text style={styles.latestTitle}>Latest Measurements</Text>
            <Text style={styles.latestDate}>{format(parseISO(latestRecord.recorded_at), 'dd MMM yyyy')}</Text>
            <View style={styles.metricsRow}>
              {latestRecord.weight_kg && <Metric emoji="⚖️" label="Weight" value={`${latestRecord.weight_kg} kg`} />}
              {latestRecord.height_cm && <Metric emoji="📏" label="Height" value={`${latestRecord.height_cm} cm`} />}
              {latestRecord.head_cm && <Metric emoji="🎩" label="Head" value={`${latestRecord.head_cm} cm`} />}
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {['chart', 'history'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.tabActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t === 'chart' ? '📈 Chart' : '📋 History'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'chart' && chartData && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weight (kg) vs WHO 50th percentile</Text>
            <LineChart
              data={chartData}
              width={W - 48}
              height={200}
              chartConfig={{
                backgroundColor: Colors.surface,
                backgroundGradientFrom: Colors.surface,
                backgroundGradientTo: Colors.surface,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(224,122,150,${opacity})`,
                labelColor: () => Colors.textSecondary,
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primaryDark },
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.primaryDark }]} /><Text style={styles.legendText}>Baby</Text></View>
              <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.secondary }]} /><Text style={styles.legendText}>WHO 50th</Text></View>
            </View>
          </View>
        )}

        {activeTab === 'chart' && !chartData && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyText}>Add measurements to see the growth chart</Text>
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.card}>
            {growthRecords.length === 0 && (
              <Text style={styles.emptyText}>No records yet</Text>
            )}
            {[...growthRecords].reverse().map((r, idx) => (
              <View key={r.id} style={[styles.histRow, idx < growthRecords.length - 1 && styles.rowBorder]}>
                <View style={styles.histInfo}>
                  <Text style={styles.histDate}>{format(parseISO(r.recorded_at), 'dd MMM yyyy')}</Text>
                  <View style={styles.histMetrics}>
                    {r.weight_kg && <Text style={styles.histVal}>{r.weight_kg} kg</Text>}
                    {r.height_cm && <Text style={styles.histVal}>{r.height_cm} cm</Text>}
                    {r.head_cm && <Text style={styles.histVal}>HC: {r.head_cm} cm</Text>}
                  </View>
                  {r.notes && <Text style={styles.histNotes}>{r.notes}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDelete(r.id)}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Measurement</Text>

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} placeholder="e.g. 7.5" placeholderTextColor={Colors.textLight} keyboardType="numeric" value={weight} onChangeText={setWeight} />

            <Text style={styles.label}>Height (cm)</Text>
            <TextInput style={styles.input} placeholder="e.g. 68.0" placeholderTextColor={Colors.textLight} keyboardType="numeric" value={height} onChangeText={setHeight} />

            <Text style={styles.label}>Head Circumference (cm)</Text>
            <TextInput style={styles.input} placeholder="e.g. 42.5" placeholderTextColor={Colors.textLight} keyboardType="numeric" value={head} onChangeText={setHead} />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput style={styles.input} placeholder="Any notes..." placeholderTextColor={Colors.textLight} value={notes} onChangeText={setNotes} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
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

const Metric = ({ emoji, label, value }) => (
  <View style={styles.metric}>
    <Text style={styles.metricEmoji}>{emoji}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primaryDark, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  latestCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  latestTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  latestDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginBottom: 12 },
  metricsRow: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, alignItems: 'center', backgroundColor: Colors.background, borderRadius: 14, padding: 12 },
  metricEmoji: { fontSize: 22, marginBottom: 4 },
  metricValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  metricLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', backgroundColor: Colors.surface },
  tabActive: { backgroundColor: '#FFF0F5', borderWidth: 1.5, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primaryDark },
  chartCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  chartTitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12, fontWeight: '600' },
  legendRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: Colors.textSecondary },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  histRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  histInfo: { flex: 1 },
  histDate: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  histMetrics: { flexDirection: 'row', gap: 10 },
  histVal: { fontSize: 13, color: Colors.primaryDark, fontWeight: '600', backgroundColor: '#FFF0F5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  histNotes: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  deleteBtn: { color: Colors.textLight, fontSize: 14, padding: 4 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: Colors.textSecondary, marginTop: 12, fontSize: 15, textAlign: 'center', padding: 20 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.textPrimary, backgroundColor: Colors.background },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: Colors.primaryDark, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },
});

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import { useBaby } from '../context/BabyContext';
import { generateAndShareReport } from '../utils/pdfReport';
import { format, parseISO } from 'date-fns';

export default function ReportsScreen() {
  const { baby, feedings, growthRecords, vaccinations } = useBaby();
  const [generating, setGenerating] = useState(false);

  const handleGenerateReport = async () => {
    if (!baby) { Alert.alert('No baby profile found.'); return; }
    setGenerating(true);
    try {
      await generateAndShareReport(baby, feedings, growthRecords, vaccinations);
    } catch (e) {
      Alert.alert('Error generating report', e.message);
    } finally {
      setGenerating(false);
    }
  };

  const totalFeedings = feedings.length;
  const formulaCount = feedings.filter(f => f.type === 'formula').length;
  const breastCount = feedings.filter(f => f.type === 'breastfeed').length;
  const totalMl = feedings.filter(f => f.amount_ml).reduce((s, f) => s + f.amount_ml, 0);
  const latestWeight = growthRecords.length ? growthRecords[growthRecords.length - 1] : null;
  const vaccDone = vaccinations.filter(v => v.administered_at).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Reports</Text>

      {/* Summary cards */}
      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.summaryGrid}>
        <SummaryCard emoji="🍼" label="Total Feedings" value={totalFeedings} />
        <SummaryCard emoji="🤱" label="Breastfeeds" value={breastCount} />
        <SummaryCard emoji="🧴" label="Formula" value={formulaCount} />
        <SummaryCard emoji="💧" label="Total ml" value={Math.round(totalMl)} />
      </View>

      {latestWeight && (
        <>
          <Text style={styles.sectionTitle}>Latest Growth</Text>
          <View style={styles.growthCard}>
            <GrowthRow label="Weight" value={latestWeight.weight_kg ? `${latestWeight.weight_kg} kg` : '—'} />
            <GrowthRow label="Height" value={latestWeight.height_cm ? `${latestWeight.height_cm} cm` : '—'} />
            <GrowthRow label="Head Circ." value={latestWeight.head_cm ? `${latestWeight.head_cm} cm` : '—'} />
            <GrowthRow label="Recorded" value={format(parseISO(latestWeight.recorded_at), 'dd MMM yyyy')} last />
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Vaccinations</Text>
      <View style={styles.vaccCard}>
        <View style={styles.vaccRow}>
          <Text style={styles.vaccLabel}>Completed</Text>
          <Text style={styles.vaccValue}>{vaccDone} / {vaccinations.length}</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${vaccinations.length ? (vaccDone / vaccinations.length) * 100 : 0}%` }]} />
        </View>
      </View>

      {/* Generate PDF */}
      <Text style={styles.sectionTitle}>Export</Text>
      <TouchableOpacity
        style={[styles.pdfBtn, generating && styles.pdfBtnDisabled]}
        onPress={handleGenerateReport}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.pdfEmoji}>📄</Text>
            <View>
              <Text style={styles.pdfTitle}>Generate PDF Report</Text>
              <Text style={styles.pdfSub}>Includes feeding, growth & vaccination data</Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.shareNote}>
        <Text style={styles.shareNoteText}>
          📤 After generating, you can share the PDF directly with your doctor via email, WhatsApp, or any app.
        </Text>
      </View>
    </ScrollView>
  );
}

const SummaryCard = ({ emoji, label, value }) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryEmoji}>{emoji}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const GrowthRow = ({ label, value, last }) => (
  <View style={[styles.growthRow, !last && styles.growthRowBorder]}>
    <Text style={styles.growthLabel}>{label}</Text>
    <Text style={styles.growthValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { width: '47%', backgroundColor: Colors.surface, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  summaryEmoji: { fontSize: 28, marginBottom: 6 },
  summaryValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  growthCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  growthRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  growthRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  growthLabel: { fontSize: 14, color: Colors.textSecondary },
  growthValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  vaccCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  vaccRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  vaccLabel: { fontSize: 14, color: Colors.textSecondary },
  vaccValue: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark },
  progressBar: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: 10, backgroundColor: Colors.success, borderRadius: 5 },
  pdfBtn: { backgroundColor: Colors.primaryDark, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: Colors.primaryDark, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  pdfBtnDisabled: { opacity: 0.6 },
  pdfEmoji: { fontSize: 32 },
  pdfTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  pdfSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  shareNote: { backgroundColor: '#EFF8FF', borderRadius: 14, padding: 14, marginTop: 16 },
  shareNoteText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { useBaby } from '../context/BabyContext';
import { differenceInDays, differenceInMonths, format, parseISO } from 'date-fns';

const StatCard = ({ label, value, unit, color, emoji }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={styles.statValue}>{value}<Text style={styles.statUnit}> {unit}</Text></Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function HomeScreen({ navigation }) {
  const { baby, feedings, growthRecords, vaccinations } = useBaby();

  const ageText = useMemo(() => {
    if (!baby?.dob) return '';
    const months = differenceInMonths(new Date(), parseISO(baby.dob));
    const days = differenceInDays(new Date(), parseISO(baby.dob));
    if (months < 1) return `${days} days old`;
    if (months < 24) return `${months} months old`;
    return `${Math.floor(months / 12)} years old`;
  }, [baby]);

  const lastFeeding = feedings[0];
  const lastWeight = growthRecords.length ? growthRecords[growthRecords.length - 1] : null;
  const pendingVaccines = vaccinations.filter(v => !v.administered_at).length;

  const timeSinceFeeding = useMemo(() => {
    if (!lastFeeding) return null;
    const mins = Math.floor((Date.now() - new Date(lastFeeding.logged_at)) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m ago` : `${hrs}h ago`;
  }, [lastFeeding]);

  if (!baby) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello! 👋</Text>
          <Text style={styles.babyName}>{baby.name}</Text>
          <Text style={styles.ageText}>{ageText}</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>{baby.gender === 'Girl' ? '👧' : baby.gender === 'Boy' ? '👦' : '👶'}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <Text style={styles.sectionTitle}>Today's Overview</Text>
      <View style={styles.statsRow}>
        <StatCard
          emoji="🍼"
          label="Last Fed"
          value={timeSinceFeeding || '—'}
          unit=""
          color={Colors.primary}
        />
        <StatCard
          emoji="⚖️"
          label="Weight"
          value={lastWeight?.weight_kg || '—'}
          unit={lastWeight ? 'kg' : ''}
          color={Colors.secondary}
        />
        <StatCard
          emoji="💉"
          label="Pending Vaccines"
          value={pendingVaccines}
          unit=""
          color={Colors.accent}
        />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Log</Text>
      <View style={styles.actionsGrid}>
        <QuickAction emoji="🤱" label="Log Feeding" color="#FFF0F5" onPress={() => navigation.navigate('Feeding')} />
        <QuickAction emoji="📏" label="Log Growth" color="#EFF8FF" onPress={() => navigation.navigate('Growth')} />
        <QuickAction emoji="💉" label="Vaccines" color="#FFF8EC" onPress={() => navigation.navigate('Vaccination')} />
        <QuickAction emoji="📄" label="Reports" color="#F0FFF8" onPress={() => navigation.navigate('Reports')} />
      </View>

      {/* Recent Feedings */}
      {feedings.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Feedings</Text>
          <View style={styles.card}>
            {feedings.slice(0, 3).map(f => (
              <View key={f.id} style={styles.feedingRow}>
                <Text style={styles.feedingEmoji}>{f.type === 'breastfeed' ? '🤱' : '🍼'}</Text>
                <View style={styles.feedingInfo}>
                  <Text style={styles.feedingType}>{f.type === 'breastfeed' ? 'Breastfeed' : 'Formula'}</Text>
                  <Text style={styles.feedingTime}>{format(parseISO(f.logged_at), 'HH:mm · dd MMM')}</Text>
                </View>
                <Text style={styles.feedingAmount}>
                  {f.amount_ml ? `${f.amount_ml} ml` : f.duration_min ? `${f.duration_min} min` : ''}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const QuickAction = ({ emoji, label, color, onPress }) => (
  <TouchableOpacity style={[styles.quickAction, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.quickEmoji}>{emoji}</Text>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, backgroundColor: Colors.surface, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  greeting: { fontSize: 13, color: Colors.textSecondary },
  babyName: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  ageText: { fontSize: 13, color: Colors.primaryDark, marginTop: 2 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF0F5', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 36 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderLeftWidth: 3, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  statUnit: { fontSize: 11, fontWeight: '400', color: Colors.textSecondary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  quickAction: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center' },
  quickEmoji: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  feedingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  feedingEmoji: { fontSize: 22, marginRight: 12 },
  feedingInfo: { flex: 1 },
  feedingType: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  feedingTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  feedingAmount: { fontSize: 13, color: Colors.primaryDark, fontWeight: '600' },
});

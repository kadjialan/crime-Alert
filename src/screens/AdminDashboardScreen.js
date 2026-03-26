import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function AdminDashboardScreen({ navigation }) {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: '#3B82F6' },
    { label: 'Total Reports', value: stats?.totalCrimes || 0, icon: '📋', color: '#F59E0B' },
    { label: 'Active Crimes', value: stats?.activeCrimes || 0, icon: '🔴', color: '#EF4444' },
    { label: 'Emergencies', value: stats?.emergencies || 0, icon: '🚨', color: '#DC2626' },
    { label: 'Resolved', value: stats?.resolvedCrimes || 0, icon: '✅', color: '#22C55E' },
    { label: 'This Week', value: stats?.recentCrimes || 0, icon: '📅', color: '#8B5CF6' },
    { label: 'Admins', value: stats?.adminCount || 0, icon: '🛡️', color: '#6366F1' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor="#8B5CF6" />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSub}>System overview and statistics</Text>
      </View>

      <View style={styles.grid}>
        {cards.map((card, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.cardIcon}>{card.icon}</Text>
            <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
            <Text style={styles.cardLabel}>{card.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>MANAGEMENT</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ManageUsers')}>
          <Text style={styles.menuIcon}>👥</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Manage Users</Text>
            <Text style={styles.menuDesc}>View, promote, or remove users</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ManageCrimes')}>
          <Text style={styles.menuIcon}>📋</Text>
          <View style={styles.menuInfo}>
            <Text style={styles.menuLabel}>Manage Crime Reports</Text>
            <Text style={styles.menuDesc}>Update status or delete reports</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  headerSub: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '47%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardValue: { fontSize: 36, fontWeight: '900' },
  cardLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 4 },
  menuSection: { padding: 20 },
  menuTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', letterSpacing: 1, marginBottom: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuIcon: { fontSize: 28, marginRight: 14 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  menuDesc: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  menuArrow: { fontSize: 24, color: '#64748B', fontWeight: '300' },
});

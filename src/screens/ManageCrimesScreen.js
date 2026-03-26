import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { getGoogleMapsLink } from '../utils/location';

const STATUS_COLORS = {
  active: '#EF4444',
  investigating: '#F59E0B',
  resolved: '#22C55E',
};

const SEVERITY_COLORS = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#DC2626',
};

export default function ManageCrimesScreen() {
  const { token } = useAuth();
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCrimes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/crimes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCrimes(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCrimes();
  }, [fetchCrimes]);

  function changeStatus(crimeId, currentStatus) {
    const statuses = ['active', 'investigating', 'resolved'].filter((s) => s !== currentStatus);

    Alert.alert(
      'Update Status',
      'Select new status:',
      [
        ...statuses.map((status) => ({
          text: status.charAt(0).toUpperCase() + status.slice(1),
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/admin/crimes/${crimeId}/status`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
              });
              if (res.ok) fetchCrimes();
              else {
                const data = await res.json();
                Alert.alert('Error', data.message);
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  function deleteCrime(crimeId, title) {
    Alert.alert('Delete Report', `Delete "${title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/admin/crimes/${crimeId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) fetchCrimes();
            else {
              const data = await res.json();
              Alert.alert('Error', data.message);
            }
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  }

  function renderCrime({ item }) {
    return (
      <View style={[styles.card, item.isEmergency && styles.emergencyCard]}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.type}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              {' '} - Reported by {item.reporter?.name || 'Unknown'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={[styles.badge, { backgroundColor: SEVERITY_COLORS[item.severity] }]}>
              <Text style={styles.badgeText}>{item.severity.toUpperCase()}</Text>
            </View>
            <TouchableOpacity
              style={[styles.statusBadge, { borderColor: STATUS_COLORS[item.status] }]}
              onPress={() => changeStatus(item.id, item.status)}
            >
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
              <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                {item.status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        {item.address ? (
          <TouchableOpacity onPress={() => Linking.openURL(getGoogleMapsLink(item.latitude, item.longitude))}>
            <Text style={styles.address}>📍 {item.address}</Text>
          </TouchableOpacity>
        ) : item.latitude ? (
          <TouchableOpacity onPress={() => Linking.openURL(getGoogleMapsLink(item.latitude, item.longitude))}>
            <Text style={styles.address}>📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.statusBtn]}
            onPress={() => changeStatus(item.id, item.status)}
          >
            <Text style={styles.statusBtnText}>Change Status</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => deleteCrime(item.id, item.title)}
          >
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Reports</Text>
        <Text style={styles.headerSub}>{crimes.length} total crime reports</Text>
      </View>

      {crimes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No crime reports yet</Text>
        </View>
      ) : (
        <FlatList
          data={crimes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCrime}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCrimes(); }} tintColor="#8B5CF6" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  headerSub: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emergencyCard: { borderColor: '#DC2626', borderWidth: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 8 },
  title: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  type: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800' },
  description: { fontSize: 14, color: '#CBD5E1', marginTop: 10, lineHeight: 20 },
  address: { fontSize: 13, color: '#3B82F6', marginTop: 6 },
  date: { fontSize: 12, color: '#64748B', marginTop: 6 },
  emptyText: { fontSize: 16, color: '#94A3B8' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  statusBtn: { backgroundColor: '#1E1B4B', borderWidth: 1, borderColor: '#6366F1' },
  statusBtnText: { color: '#A5B4FC', fontSize: 13, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#450A0A', borderWidth: 1, borderColor: '#DC2626' },
  deleteBtnText: { color: '#FCA5A5', fontSize: 13, fontWeight: '700' },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { getGPSLocation, getGoogleMapsLink } from '../utils/location';

const CRIME_ICONS = {
  theft: '🔓',
  assault: '👊',
  robbery: '💰',
  vandalism: '🔨',
  fraud: '📄',
  burglary: '🏠',
  other: '⚠️',
};

const SEVERITY_COLORS = {
  low: '#22C55E',
  medium: '#F59E0B',
  high: '#F97316',
  critical: '#DC2626',
};

export default function HomeScreen({ navigation }) {
  const { token } = useAuth();
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);

  const fetchCrimes = useCallback(async () => {
    try {
      let url = `${API_URL}/crimes?limit=30`;

      if (location) {
        url = `${API_URL}/crimes/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=10000`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCrimes(data.crimes || data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, location]);

  useEffect(() => {
    (async () => {
      const coords = await getGPSLocation();
      if (coords) setLocation(coords);
    })();
  }, []);

  useEffect(() => {
    fetchCrimes();
  }, [fetchCrimes]);

  function onRefresh() {
    setRefreshing(true);
    fetchCrimes();
  }

  function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  function openCrimeOnMap(item) {
    const coords = item.location?.coordinates;
    if (coords && coords.length === 2) {
      Linking.openURL(getGoogleMapsLink(coords[1], coords[0]));
    }
  }

  function renderCrime({ item }) {
    const coords = item.location?.coordinates;
    const hasLocation = coords && coords.length === 2;

    return (
      <TouchableOpacity
        style={[styles.card, item.isEmergency && styles.emergencyCard]}
        onPress={() => hasLocation && openCrimeOnMap(item)}
        activeOpacity={hasLocation ? 0.7 : 1}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>{CRIME_ICONS[item.type] || '⚠️'}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardType}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[item.severity] }]}>
              <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
            </View>
            <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        {item.location?.address ? (
          <View style={styles.locationRow}>
            <Text style={styles.address}>📍 {item.location.address}</Text>
            <Text style={styles.mapLink}>View Map</Text>
          </View>
        ) : hasLocation ? (
          <View style={styles.locationRow}>
            <Text style={styles.address}>
              📍 {coords[1].toFixed(4)}, {coords[0].toFixed(4)}
            </Text>
            <Text style={styles.mapLink}>View Map</Text>
          </View>
        ) : null}
        {item.isEmergency && (
          <View style={styles.emergencyBadge}>
            <Text style={styles.emergencyText}>🚨 EMERGENCY</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading crime reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ Crime Alert</Text>
        <Text style={styles.headerSub}>
          {crimes.length} report{crimes.length !== 1 ? 's' : ''} nearby
        </Text>
      </View>

      {crimes.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All Clear</Text>
          <Text style={styles.emptyText}>No crime reports in your area</Text>
        </View>
      ) : (
        <FlatList
          data={crimes}
          keyExtractor={(item) => item._id?.toString()}
          renderItem={renderCrime}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ReportCrime')}
      >
        <Text style={styles.fabText}>+ Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
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
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emergencyCard: { borderColor: '#DC2626', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { fontSize: 32, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  cardType: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  severityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  severityText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  timeText: { fontSize: 12, color: '#64748B' },
  description: { fontSize: 14, color: '#CBD5E1', lineHeight: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  address: { fontSize: 13, color: '#94A3B8', flex: 1 },
  mapLink: { fontSize: 13, color: '#3B82F6', fontWeight: '600', marginLeft: 8 },
  emergencyBadge: {
    marginTop: 8,
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  emergencyText: { color: '#FCA5A5', fontSize: 12, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 15 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginTop: 12 },
  emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#DC2626',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    elevation: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

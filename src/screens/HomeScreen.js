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
  Image,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { getGoogleMapsLink } from '../utils/location';

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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { token, logout } = useAuth();
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCrime, setSelectedCrime] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);

  const fetchCrimes = useCallback(async () => {
    try {
      // Always fetch the latest reports system-wide. The previous version
      // re-fetched /crimes/nearby once GPS resolved, which would wipe the
      // list whenever there were no crimes within 10 km of the user.
      const res = await fetch(`${API_URL}/crimes?limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        // Token expired or invalid — sign out so the user lands on Login.
        await logout();
        return;
      }
      const data = await res.json();
      setCrimes(data.crimes || data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, logout]);

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
        onPress={() => setSelectedCrime(item)}
        activeOpacity={0.7}
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
        {item.images && item.images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
          >
            {item.images.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={(e) => {
                  e.stopPropagation?.();
                  setViewerImage(uri);
                }}
              >
                <Image source={{ uri }} style={styles.imageThumb} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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

      {/* Crime detail modal */}
      <Modal
        visible={!!selectedCrime}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedCrime(null)}
      >
        {selectedCrime && (
          <View style={styles.detailContainer}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setSelectedCrime(null)} style={styles.detailClose}>
                <Text style={styles.detailCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.detailHeaderTitle} numberOfLines={1}>
                Report Details
              </Text>
              <View style={{ width: 36 }} />
            </View>
            <ScrollView contentContainerStyle={styles.detailContent}>
              <View style={styles.detailTitleRow}>
                <Text style={styles.detailIcon}>{CRIME_ICONS[selectedCrime.type] || '⚠️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{selectedCrime.title}</Text>
                  <Text style={styles.detailType}>
                    {selectedCrime.type.charAt(0).toUpperCase() + selectedCrime.type.slice(1)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: SEVERITY_COLORS[selectedCrime.severity] },
                  ]}
                >
                  <Text style={styles.severityText}>{selectedCrime.severity.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.detailMeta}>{timeAgo(selectedCrime.createdAt)}</Text>

              {selectedCrime.isEmergency && (
                <View style={styles.detailEmergency}>
                  <Text style={styles.detailEmergencyText}>🚨 EMERGENCY ALERT</Text>
                </View>
              )}

              <Text style={styles.detailSectionTitle}>Description</Text>
              <Text style={styles.detailDescription}>{selectedCrime.description}</Text>

              {selectedCrime.images && selectedCrime.images.length > 0 && (
                <>
                  <Text style={styles.detailSectionTitle}>
                    Photos ({selectedCrime.images.length})
                  </Text>
                  <View style={styles.detailImageGrid}>
                    {selectedCrime.images.map((uri, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setViewerImage(uri)}>
                        <Image source={{ uri }} style={styles.detailImage} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {selectedCrime.location?.address || selectedCrime.location?.coordinates ? (
                <>
                  <Text style={styles.detailSectionTitle}>Location</Text>
                  <Text style={styles.detailAddress}>
                    📍 {selectedCrime.location.address ||
                      `${selectedCrime.location.coordinates[1].toFixed(4)}, ${selectedCrime.location.coordinates[0].toFixed(4)}`}
                  </Text>
                  {selectedCrime.location.coordinates && (
                    <TouchableOpacity
                      style={styles.detailMapBtn}
                      onPress={() => openCrimeOnMap(selectedCrime)}
                    >
                      <Text style={styles.detailMapBtnText}>Open in Google Maps</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : null}

              {selectedCrime.reportedBy?.name && (
                <Text style={styles.detailReporter}>
                  Reported by {selectedCrime.reportedBy.name}
                </Text>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Fullscreen image viewer */}
      <Modal
        visible={!!viewerImage}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerImage(null)}
      >
        <View style={styles.viewerContainer}>
          <TouchableOpacity
            style={styles.viewerClose}
            onPress={() => setViewerImage(null)}
          >
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  imageScroll: { marginTop: 8 },
  imageThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
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

  // Detail modal
  detailContainer: { flex: 1, backgroundColor: '#0F172A' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCloseText: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  detailHeaderTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  detailContent: { padding: 20, paddingBottom: 60 },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailIcon: { fontSize: 40, marginRight: 12 },
  detailTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC' },
  detailType: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
  detailMeta: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  detailEmergency: {
    backgroundColor: '#7F1D1D',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  detailEmergencyText: { color: '#FCA5A5', fontSize: 13, fontWeight: '800' },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  detailDescription: { fontSize: 15, color: '#CBD5E1', lineHeight: 22 },
  detailImageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailAddress: { fontSize: 14, color: '#CBD5E1' },
  detailMapBtn: {
    marginTop: 10,
    backgroundColor: '#1D4ED8',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  detailMapBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  detailReporter: { fontSize: 13, color: '#64748B', marginTop: 18, fontStyle: 'italic' },

  // Image viewer
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCloseText: { color: '#fff', fontSize: 20, fontWeight: '700' },
});

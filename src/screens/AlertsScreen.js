import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { API_URL, SOCKET_URL } from '../config/api';

export default function AlertsScreen() {
  const { token, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  // Seed the alerts list with recent crimes from the backend so the screen
  // isn't blank on first open. Without this, the list only fills as new
  // socket events arrive in real time.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/crimes?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          await logout();
          return;
        }
        const data = await res.json();
        const list = data.crimes || data || [];
        if (cancelled) return;
        const seeded = list.map((c) => ({
          id: `seed-${c._id}`,
          crime: c,
          message: c.isEmergency
            ? `EMERGENCY: ${c.title}`
            : `Crime Alert: ${c.title}`,
          receivedAt: c.createdAt,
          type: c.isEmergency ? 'emergency' : 'crime',
        }));
        setAlerts(seeded);
      } catch {
        // ignore — socket events will still populate the list
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('crime-alert', (data) => {
      setAlerts((prev) => [
        { id: Date.now().toString(), ...data, receivedAt: new Date().toISOString(), type: 'crime' },
        ...prev,
      ]);
    });

    socket.on('emergency-alert', (data) => {
      setAlerts((prev) => [
        {
          id: Date.now().toString(),
          ...data,
          receivedAt: new Date().toISOString(),
          type: 'emergency',
        },
        ...prev,
      ]);
    });

    socket.on('new-crime', (crime) => {
      setAlerts((prev) => [
        {
          id: Date.now().toString() + '-map',
          crime,
          message: `New report: ${crime.title}`,
          receivedAt: new Date().toISOString(),
          type: 'info',
        },
        ...prev,
      ]);
    });

    return () => socket.disconnect();
  }, [token]);

  function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  function renderAlert({ item }) {
    const isEmergency = item.type === 'emergency';
    const isCrime = item.type === 'crime';

    return (
      <View style={[styles.alertCard, isEmergency && styles.emergencyAlert]}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertIcon}>
            {isEmergency ? '🚨' : isCrime ? '⚠️' : 'ℹ️'}
          </Text>
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, isEmergency && { color: '#FCA5A5' }]}>
              {isEmergency ? 'EMERGENCY ALERT' : isCrime ? 'Crime Alert' : 'New Report'}
            </Text>
            <Text style={styles.alertMessage}>{item.message}</Text>
            {item.crime?.location?.address ? (
              <Text style={styles.alertLocation}>📍 {item.crime.location.address}</Text>
            ) : null}
          </View>
          <Text style={styles.alertTime}>{timeAgo(item.receivedAt)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔔 Alerts</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#22C55E' : '#EF4444' }]} />
          <Text style={styles.statusText}>{connected ? 'Live' : 'Connecting...'}</Text>
        </View>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No Alerts Yet</Text>
          <Text style={styles.emptyText}>
            You'll receive real-time notifications when crimes are reported nearby.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          renderItem={renderAlert}
          contentContainerStyle={styles.list}
        />
      )}

      {alerts.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={() => setAlerts([])}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#F8FAFC' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 80 },
  alertCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emergencyAlert: { borderColor: '#DC2626', backgroundColor: '#1C1917' },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  alertIcon: { fontSize: 24, marginRight: 12, marginTop: 2 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#F8FAFC' },
  alertMessage: { fontSize: 14, color: '#CBD5E1', marginTop: 4, lineHeight: 20 },
  alertLocation: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  alertTime: { fontSize: 12, color: '#64748B' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, opacity: 0.5 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#F8FAFC', marginTop: 16 },
  emptyText: { fontSize: 15, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  clearBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#334155',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  clearText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
});

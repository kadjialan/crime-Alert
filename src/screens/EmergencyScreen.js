import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { getGPSLocation, reverseGeocode } from '../utils/location';
import MapPreview from '../components/MapPreview';

export default function EmergencyScreen() {
  const { token } = useAuth();
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    (async () => {
      const coords = await getGPSLocation();
      if (coords) {
        setLocation(coords);
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        if (geo) setAddress(geo.fullAddress);
      }
    })();
  }, []);

  async function handleEmergency() {
    if (!location) {
      return Alert.alert('Error', 'Cannot determine your location. Please enable GPS.');
    }

    Alert.alert(
      'Send Emergency Alert',
      'This will immediately notify all nearby users and authorities. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND ALERT', style: 'destructive', onPress: sendAlert },
      ]
    );
  }

  async function sendAlert() {
    setSending(true);
    Vibration.vibrate([0, 200, 100, 200]);
    try {
      const res = await fetch(`${API_URL}/crimes/emergency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          message: message.trim() || 'Emergency! Immediate help needed!',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(true);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.sentContainer}>
          <Text style={styles.sentIcon}>✅</Text>
          <Text style={styles.sentTitle}>Alert Sent!</Text>
          <Text style={styles.sentText}>
            Your emergency alert has been sent to all nearby users. Help is on the way.
          </Text>
          {location && (
            <MapPreview
              latitude={location.latitude}
              longitude={location.longitude}
              address={address}
              style={{ width: '100%', marginTop: 16 }}
            />
          )}
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setSent(false);
              setMessage('');
            }}
          >
            <Text style={styles.resetText}>Send Another Alert</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Emergency</Text>
        <Text style={styles.headerSub}>
          Send an immediate alert to nearby users with your location
        </Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity
          style={[styles.sosButton, sending && { opacity: 0.6 }]}
          onPress={handleEmergency}
          disabled={sending}
          activeOpacity={0.7}
        >
          {sending ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>TAP TO SEND ALERT</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Message (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe your emergency..."
          placeholderTextColor="#64748B"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {location ? (
          <MapPreview
            latitude={location.latitude}
            longitude={location.longitude}
            address={address}
            style={{ width: '100%', marginTop: 16 }}
          />
        ) : (
          <View style={styles.locationInfo}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.locationLabel}>Getting your GPS location...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#7F1D1D',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FCA5A5' },
  headerSub: { fontSize: 14, color: '#FECACA', marginTop: 4 },
  body: { flex: 1, padding: 24, alignItems: 'center' },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
    elevation: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    borderWidth: 4,
    borderColor: '#FCA5A5',
  },
  sosText: { fontSize: 48, fontWeight: '900', color: '#fff' },
  sosSubtext: { fontSize: 11, fontWeight: '700', color: '#FECACA', marginTop: 4 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#F8FAFC',
    minHeight: 80,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    gap: 8,
  },
  locationLabel: { fontSize: 14, color: '#94A3B8' },
  sentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  sentIcon: { fontSize: 64 },
  sentTitle: { fontSize: 28, fontWeight: '800', color: '#22C55E', marginTop: 16 },
  sentText: { fontSize: 16, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 24 },
  resetBtn: {
    marginTop: 32,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resetText: { color: '#F8FAFC', fontSize: 16, fontWeight: '600' },
});

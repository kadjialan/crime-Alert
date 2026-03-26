import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { getGPSLocation, reverseGeocode } from '../utils/location';
import MapPreview from '../components/MapPreview';

const CRIME_TYPES = [
  { key: 'theft', label: 'Theft', icon: '🔓' },
  { key: 'assault', label: 'Assault', icon: '👊' },
  { key: 'robbery', label: 'Robbery', icon: '💰' },
  { key: 'vandalism', label: 'Vandalism', icon: '🔨' },
  { key: 'fraud', label: 'Fraud', icon: '📄' },
  { key: 'burglary', label: 'Burglary', icon: '🏠' },
  { key: 'other', label: 'Other', icon: '⚠️' },
];

const SEVERITY_LEVELS = [
  { key: 'low', label: 'Low', color: '#22C55E' },
  { key: 'medium', label: 'Medium', color: '#F59E0B' },
  { key: 'high', label: 'High', color: '#F97316' },
  { key: 'critical', label: 'Critical', color: '#DC2626' },
];

export default function ReportCrimeScreen({ navigation }) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [address, setAddress] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(true);

  useEffect(() => {
    (async () => {
      const coords = await getGPSLocation();
      if (coords) {
        setLocation(coords);
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        if (geo) {
          setAddress(geo.shortAddress);
          setFullAddress(geo.fullAddress);
        }
      }
      setFetchingLocation(false);
    })();
  }, []);

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert('Error', 'Please enter a title.');
    if (!type) return Alert.alert('Error', 'Please select a crime type.');
    if (!description.trim()) return Alert.alert('Error', 'Please enter a description.');
    if (!location) return Alert.alert('Error', 'Location is required. Please enable location services.');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/crimes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          severity,
          latitude: location.latitude,
          longitude: location.longitude,
          address: fullAddress || address,
          isEmergency: severity === 'critical',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Alert.alert('Success', 'Crime report submitted. Nearby users have been notified.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Report a Crime</Text>
      <Text style={styles.subheading}>Help keep your community safe</Text>

      {/* Title */}
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="Brief title of the incident"
        placeholderTextColor="#64748B"
        value={title}
        onChangeText={setTitle}
      />

      {/* Crime Type */}
      <Text style={styles.label}>Crime Type *</Text>
      <View style={styles.chipRow}>
        {CRIME_TYPES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.chip, type === t.key && styles.chipActive]}
            onPress={() => setType(t.key)}
          >
            <Text style={styles.chipIcon}>{t.icon}</Text>
            <Text style={[styles.chipLabel, type === t.key && styles.chipLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Severity */}
      <Text style={styles.label}>Severity</Text>
      <View style={styles.severityRow}>
        {SEVERITY_LEVELS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[
              styles.severityBtn,
              { borderColor: s.color },
              severity === s.key && { backgroundColor: s.color },
            ]}
            onPress={() => setSeverity(s.key)}
          >
            <Text
              style={[
                styles.severityLabel,
                severity === s.key && { color: '#fff' },
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what happened..."
        placeholderTextColor="#64748B"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Location with Map */}
      <Text style={styles.label}>Location</Text>
      {fetchingLocation ? (
        <View style={styles.locationLoading}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.locationLoadingText}>Getting your GPS location...</Text>
        </View>
      ) : location ? (
        <MapPreview
          latitude={location.latitude}
          longitude={location.longitude}
          address={fullAddress || address}
        />
      ) : (
        <Text style={styles.locationError}>
          Location unavailable. Please enable GPS in your device settings.
        </Text>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  heading: { fontSize: 26, fontWeight: '800', color: '#F8FAFC' },
  subheading: { fontSize: 15, color: '#94A3B8', marginTop: 4, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#CBD5E1', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#F8FAFC',
  },
  textArea: { minHeight: 100 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#1D4ED8', borderColor: '#3B82F6' },
  chipIcon: { fontSize: 16, marginRight: 6 },
  chipLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  chipLabelActive: { color: '#fff' },
  severityRow: { flexDirection: 'row', gap: 8 },
  severityBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  severityLabel: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  locationLoadingText: { fontSize: 14, color: '#94A3B8' },
  locationError: { fontSize: 14, color: '#F87171', marginTop: 4 },
  submitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

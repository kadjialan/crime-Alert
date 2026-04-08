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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { getGPSLocation, reverseGeocode } from '../utils/location';
import MapPreview from '../components/MapPreview';

const MAX_IMAGES = 4;

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
  const [images, setImages] = useState([]); // array of base64 data URIs

  async function pickImage() {
    if (images.length >= MAX_IMAGES) {
      return Alert.alert('Limit reached', `You can attach up to ${MAX_IMAGES} images.`);
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permission required', 'Photo library access is needed to attach images.');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const dataUri = `data:image/jpeg;base64,${asset.base64}`;
    setImages((prev) => [...prev, dataUri]);
  }

  async function takePhoto() {
    if (images.length >= MAX_IMAGES) {
      return Alert.alert('Limit reached', `You can attach up to ${MAX_IMAGES} images.`);
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      return Alert.alert('Permission required', 'Camera access is needed to take photos.');
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const dataUri = `data:image/jpeg;base64,${asset.base64}`;
    setImages((prev) => [...prev, dataUri]);
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

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
    // Collect ALL validation errors up front so the user sees every
    // missing/invalid field in a single alert instead of fixing them
    // one popup at a time.
    const errors = [];
    if (!title.trim()) {
      errors.push('• Title is required');
    } else if (title.trim().length < 3) {
      errors.push('• Title must be at least 3 characters');
    }
    if (!type) {
      errors.push('• Crime type must be selected');
    }
    if (!description.trim()) {
      errors.push('• Description is required');
    } else if (description.trim().length < 10) {
      errors.push('• Description must be at least 10 characters');
    }
    if (!location) {
      errors.push('• Location is required (enable GPS / location services)');
    }

    if (errors.length > 0) {
      Alert.alert(
        'Missing or invalid fields',
        `Please fix the following before submitting:\n\n${errors.join('\n')}`
      );
      return;
    }

    setSubmitting(true);
    try {
      let res;
      try {
        res = await fetch(`${API_URL}/crimes`, {
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
            images,
          }),
        });
      } catch {
        // fetch threw → network/connectivity issue
        Alert.alert(
          'Network error',
          'Could not reach the server. Please check your internet connection and try again.'
        );
        return;
      }

      let data = null;
      try {
        data = await res.json();
      } catch {
        // Non-JSON response (e.g. HTML 500 page)
      }

      if (res.status === 401) {
        Alert.alert('Session expired', 'Please log in again to submit reports.');
        return;
      }

      if (res.status === 413) {
        Alert.alert(
          'Images too large',
          'Your attached photos exceed the upload limit. Please remove some images and try again.'
        );
        return;
      }

      if (!res.ok) {
        Alert.alert(
          'Submission failed',
          (data && data.message) || `Server returned status ${res.status}. Please try again.`
        );
        return;
      }

      // Success — navigate back to Home immediately. Doing this *before*
      // showing the alert avoids a bug where the Alert callback is
      // dropped on some platforms (Android/Expo) and the user gets stuck
      // on the report screen even though the POST succeeded.
      navigation.navigate('MainTabs', { screen: 'Home' });
      Alert.alert('Success', 'Crime report submitted. Nearby users have been notified.');
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

      {/* Photos */}
      <Text style={styles.label}>Photos (optional)</Text>
      <Text style={styles.helperText}>
        Attach up to {MAX_IMAGES} images as evidence.
      </Text>
      <View style={styles.imageRow}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrap}>
            <Image source={{ uri }} style={styles.imageThumb} />
            <TouchableOpacity
              style={styles.imageRemove}
              onPress={() => removeImage(index)}
            >
              <Text style={styles.imageRemoveText}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        {images.length < MAX_IMAGES && (
          <>
            <TouchableOpacity style={styles.imageAdd} onPress={pickImage}>
              <Text style={styles.imageAddIcon}>🖼️</Text>
              <Text style={styles.imageAddLabel}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageAdd} onPress={takePhoto}>
              <Text style={styles.imageAddIcon}>📷</Text>
              <Text style={styles.imageAddLabel}>Camera</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

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
  helperText: { fontSize: 12, color: '#64748B', marginTop: -4, marginBottom: 8 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  imageWrap: { position: 'relative' },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  imageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#DC2626',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageRemoveText: { color: '#fff', fontSize: 16, fontWeight: '700', lineHeight: 18 },
  imageAdd: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#475569',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAddIcon: { fontSize: 22 },
  imageAddLabel: { fontSize: 11, color: '#94A3B8', marginTop: 4, fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { getGoogleMapsLink } from '../utils/location';

export default function MapPreview({ latitude, longitude, address, style }) {
  if (!latitude || !longitude) return null;

  const mapLink = getGoogleMapsLink(latitude, longitude);

  // OpenStreetMap tile URL for a static preview
  const tileZ = 15;
  const n = Math.pow(2, tileZ);
  const tileX = Math.floor(((longitude + 180) / 360) * n);
  const latRad = (latitude * Math.PI) / 180;
  const tileY = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);

  function openInMaps() {
    Linking.openURL(mapLink);
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.mapBox} onPress={openInMaps} activeOpacity={0.8}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPin}>📍</Text>
          <View style={styles.gridOverlay}>
            {[0, 1, 2].map((row) => (
              <View key={row} style={styles.gridRow}>
                {[0, 1, 2, 3].map((col) => (
                  <View
                    key={col}
                    style={[
                      styles.gridCell,
                      row === 1 && col === 1 && styles.gridCellCenter,
                      row === 1 && col === 2 && styles.gridCellCenter,
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
        <View style={styles.mapOverlay}>
          <Text style={styles.openMapText}>Open in Google Maps</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.addressBox}>
        <Text style={styles.addressIcon}>📍</Text>
        <View style={styles.addressContent}>
          {address ? (
            <Text style={styles.addressText}>{address}</Text>
          ) : (
            <Text style={styles.coordsText}>
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </Text>
          )}
          <TouchableOpacity onPress={openInMaps}>
            <Text style={styles.viewMapLink}>View on Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  mapBox: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a3a2a',
    position: 'relative',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3A2F',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  gridRow: { flex: 1, flexDirection: 'row' },
  gridCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#4ADE80',
  },
  gridCellCenter: { backgroundColor: 'rgba(74, 222, 128, 0.15)' },
  mapPin: { fontSize: 36, zIndex: 2 },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  openMapText: { color: '#3B82F6', fontSize: 13, fontWeight: '700' },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addressIcon: { fontSize: 18, marginRight: 10, marginTop: 2 },
  addressContent: { flex: 1 },
  addressText: { fontSize: 14, color: '#F8FAFC', lineHeight: 20 },
  coordsText: { fontSize: 13, color: '#94A3B8' },
  viewMapLink: { color: '#3B82F6', fontSize: 13, fontWeight: '600', marginTop: 4 },
});

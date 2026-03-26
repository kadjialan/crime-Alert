import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, isAdmin, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        {isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        )}
        <Text style={styles.email}>{user?.email}</Text>
        {user?.phone ? <Text style={styles.phone}>📱 {user.phone}</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member since</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>Active</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{isAdmin ? 'Administrator' : 'User'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Tips</Text>
        <Text style={styles.tip}>• Always be aware of your surroundings</Text>
        <Text style={styles.tip}>• Report suspicious activity immediately</Text>
        <Text style={styles.tip}>• Share your location with trusted contacts</Text>
        <Text style={styles.tip}>• Keep emergency numbers saved</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    alignItems: 'center',
    paddingTop: 70,
    paddingBottom: 24,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#F8FAFC' },
  email: { fontSize: 15, color: '#94A3B8', marginTop: 4 },
  phone: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  adminBadge: {
    backgroundColor: '#4C1D95',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 8,
    marginBottom: 2,
  },
  adminBadgeText: { color: '#C4B5FD', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  section: { padding: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  infoLabel: { fontSize: 15, color: '#94A3B8' },
  infoValue: { fontSize: 15, color: '#F8FAFC', fontWeight: '600' },
  activeBadge: { backgroundColor: '#166534', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  activeText: { color: '#4ADE80', fontSize: 13, fontWeight: '700' },
  tip: { fontSize: 14, color: '#94A3B8', lineHeight: 24, marginLeft: 4 },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: { color: '#FCA5A5', fontSize: 16, fontWeight: '700' },
});

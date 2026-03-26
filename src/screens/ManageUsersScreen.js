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
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

export default function ManageUsersScreen() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    Alert.alert(
      'Change Role',
      `Set this user as ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: newRole }),
              });
              if (res.ok) fetchUsers();
              else {
                const data = await res.json();
                Alert.alert('Error', data.message);
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  }

  async function deleteUser(userId, userName) {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) fetchUsers();
              else {
                const data = await res.json();
                Alert.alert('Error', data.message);
              }
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  }

  function renderUser({ item }) {
    const isSelf = item.id === currentUser?.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>
              {item.name} {isSelf ? '(You)' : ''}
            </Text>
            <Text style={styles.email}>{item.email}</Text>
            {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
          </View>
          <View style={[styles.roleBadge, item.role === 'admin' ? styles.adminBadge : styles.userBadge]}>
            <Text style={[styles.roleText, item.role === 'admin' ? styles.adminText : styles.userText]}>
              {item.role.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.joinDate}>
          Joined {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        {!isSelf && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.roleBtn]}
              onPress={() => toggleRole(item.id, item.role)}
            >
              <Text style={styles.roleBtnText}>
                {item.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => deleteUser(item.id, item.name)}
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
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
        <Text style={styles.headerTitle}>Manage Users</Text>
        <Text style={styles.headerSub}>{users.length} registered users</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor="#8B5CF6" />}
      />
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
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  email: { fontSize: 13, color: '#94A3B8', marginTop: 1 },
  phone: { fontSize: 12, color: '#64748B', marginTop: 1 },
  roleBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  adminBadge: { backgroundColor: '#4C1D95' },
  userBadge: { backgroundColor: '#1E3A5F' },
  roleText: { fontSize: 11, fontWeight: '800' },
  adminText: { color: '#C4B5FD' },
  userText: { color: '#93C5FD' },
  joinDate: { fontSize: 12, color: '#64748B', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  roleBtn: { backgroundColor: '#1E1B4B', borderWidth: 1, borderColor: '#6366F1' },
  roleBtnText: { color: '#A5B4FC', fontSize: 13, fontWeight: '700' },
  deleteBtn: { backgroundColor: '#450A0A', borderWidth: 1, borderColor: '#DC2626' },
  deleteBtnText: { color: '#FCA5A5', fontSize: 13, fontWeight: '700' },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function MenuScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Check if user is admin (You can refine this logic based on your DB role)
  const isAdmin = user?.email?.includes('admin') || user?.role === 'admin'; 

  const handlePreviewSystem = () => {
    if (!isAdmin) return;
    Alert.alert("Preview System", "Switching View Mode is coming in the next update!");
  };

  return (
    <View style={styles.container}>
      {/* Drag Indicator (Visual only) */}
      <View style={styles.dragIndicator} />

      <Text style={styles.headerTitle}>Menu</Text>

      <View style={styles.menuGroup}>
        {/* College Sites */}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/college-sites')}>
          <View style={styles.iconBox}>
            <Ionicons name="globe-outline" size={22} color="#007AFF" />
          </View>
          <Text style={styles.menuText}>College Sites</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Contact */}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/contact')}>
          <View style={styles.iconBox}>
            <Ionicons name="mail-outline" size={22} color="#007AFF" />
          </View>
          <Text style={styles.menuText}>Contact</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      {/* ADMIN SECTION */}
      {isAdmin && (
        <>
          <Text style={styles.sectionHeader}>ADMINISTRATION</Text>
          <View style={styles.menuGroup}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin')}>
              <View style={styles.iconBox}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#34C759" />
              </View>
              <Text style={styles.menuText}>Admin Panel</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handlePreviewSystem}>
              <View style={styles.iconBox}>
                <Ionicons name="eye-outline" size={22} color="#AF52DE" />
              </View>
              <Text style={styles.menuText}>Preview System</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Close Button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 20 },
  dragIndicator: { width: 40, height: 5, backgroundColor: '#C7C7CC', borderRadius: 3, alignSelf: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 30, fontWeight: 'bold', marginBottom: 20, color: '#000' },
  sectionHeader: { fontSize: 13, color: '#6D6D72', marginBottom: 8, marginLeft: 16, fontWeight: '600', marginTop: 25 },
  
  menuGroup: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  iconBox: { width: 32, alignItems: 'center', marginRight: 12 },
  menuText: { flex: 1, fontSize: 17, color: '#000' },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginLeft: 60 },

  closeBtn: { marginTop: 30, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  closeText: { color: '#007AFF', fontSize: 17, fontWeight: '600' }
});
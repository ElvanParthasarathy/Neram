import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, 
  TextInput, Image, ActivityIndicator, Modal, Platform, KeyboardAvoidingView 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { signOut, updateProfile } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { ref, update, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- HELPER COMPONENTS ---
const EditModal = ({ visible, title, children, onSave, onCancel }: any) => (
  <Modal visible={visible} transparent={true} animationType="slide">
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title}</Text>
        {children}
        <View style={styles.modalActions}>
          <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={onSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  // --- STATE ---
  const [formData, setFormData] = useState<any>({});
  const [hierarchy, setHierarchy] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Edit States
  const [editField, setEditField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<any>({});

  // --- LOAD DATA ---
  useEffect(() => {
    if (!user) return;

    // Load Academic Hierarchy
    onValue(ref(db, 'academic_hierarchy'), (snap) => {
      if (snap.exists()) setHierarchy(snap.val());
    });

    // Load User Profile
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setFormData(snapshot.val());
      } else {
        // Fallback if DB is empty but Auth exists
        setFormData({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        });
      }
      setLoading(false);
    });
  }, [user]);

  // --- HANDLERS ---
  const openEdit = (field: string) => {
    setEditField(field);
    if (field === 'name') {
      const names = (formData.displayName || "").split(" ");
      setTempValue({ 
        firstName: formData.firstName || names[0] || "", 
        lastName: formData.lastName || names.slice(1).join(" ") || "" 
      });
    } else if (field === 'academic') {
      setTempValue({
        batch: formData.batch || "",
        department: formData.department || "",
        section: formData.section || ""
      });
    } else {
      setTempValue({ value: formData[field] || "" });
    }
  };

  const handleSave = async () => {
    if (!user || !editField) return;

    try {
      let updates: any = {};

      if (editField === 'name') {
        const fullName = `${tempValue.firstName} ${tempValue.lastName}`.trim();
        await updateProfile(auth.currentUser!, { displayName: fullName });
        updates = { 
          displayName: fullName, 
          firstName: tempValue.firstName, 
          lastName: tempValue.lastName 
        };
      } else if (editField === 'academic') {
        updates = {
          batch: tempValue.batch,
          department: tempValue.department,
          section: tempValue.section
        };
      } else {
        updates = { [editField]: tempValue.value };
      }

      await update(ref(db, `users/${user.uid}`), updates);
      setEditField(null);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => signOut(auth) }
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <ScrollView style={styles.container}>
      
      {/* HEADER / AVATAR */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
           {formData.photoURL ? (
             <Image source={{ uri: formData.photoURL }} style={styles.avatarImage} />
           ) : (
             <Text style={styles.avatarText}>{formData.displayName?.[0] || "U"}</Text>
           )}
           <TouchableOpacity 
             style={styles.syncBtn} 
             onPress={() => {
               // Simulate Google Sync Logic
               const googlePhoto = user?.providerData[0]?.photoURL;
               if (googlePhoto) update(ref(db, `users/${user.uid}`), { photoURL: googlePhoto });
             }}
           >
             <Ionicons name="refresh" size={14} color="#fff" />
           </TouchableOpacity>
        </View>
        <Text style={styles.name}>{formData.displayName || "User Name"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* --- PERSONAL INFO SECTION --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
        <View style={styles.card}>
          
          {/* Name Row */}
          <TouchableOpacity style={styles.row} onPress={() => openEdit('name')}>
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{formData.displayName}</Text>
              </View>
            </View>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Mobile Row */}
          <TouchableOpacity style={styles.row} onPress={() => openEdit('mobile')}>
            <View style={styles.rowLeft}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.label}>Mobile</Text>
                <Text style={styles.value}>{formData.mobile || "Add Mobile"}</Text>
              </View>
            </View>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Birthday Row */}
          <TouchableOpacity style={styles.row} onPress={() => openEdit('birthday')}>
            <View style={styles.rowLeft}>
              <Ionicons name="gift-outline" size={20} color="#666" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.label}>Birthday</Text>
                <Text style={styles.value}>{formData.birthday || "Add Birthday"}</Text>
              </View>
            </View>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Gender Row */}
          <TouchableOpacity style={styles.row} onPress={() => openEdit('gender')}>
            <View style={styles.rowLeft}>
              <Ionicons name="male-female-outline" size={20} color="#666" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.label}>Gender</Text>
                <Text style={styles.value}>{formData.gender || "Add Gender"}</Text>
              </View>
            </View>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>

        </View>
      </View>

      {/* --- ACADEMIC SECTION --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACADEMIC DETAILS</Text>
        <View style={styles.card}>
          
          <TouchableOpacity style={styles.row} onPress={() => openEdit('academic')}>
            <View style={styles.rowLeft}>
              <Ionicons name="school-outline" size={20} color="#666" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.label}>Class Details</Text>
                <Text style={styles.value}>
                  {formData.batch ? `${formData.batch} | ${formData.department} - ${formData.section}` : "Not Assigned"}
                </Text>
              </View>
            </View>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => openEdit('registerNo')}>
            <View style={styles.rowLeft}>
              <Ionicons name="id-card-outline" size={20} color="#666" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.label}>Register No</Text>
                <Text style={styles.value}>{formData.registerNo || "Add Reg No"}</Text>
              </View>
            </View>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>

        </View>
      </View>

      {/* --- SOCIAL LINKS --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SOCIAL PROFILES</Text>
        <View style={styles.card}>
          
          <TouchableOpacity style={styles.row} onPress={() => openEdit('linkedin')}>
            <View style={styles.rowLeft}>
              <Ionicons name="logo-linkedin" size={20} color="#0077B5" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.label}>LinkedIn</Text>
                <Text style={styles.value} numberOfLines={1}>{formData.linkedin || "Add Profile"}</Text>
              </View>
            </View>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.row} onPress={() => openEdit('github')}>
            <View style={styles.rowLeft}>
              <Ionicons name="logo-github" size={20} color="#000" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.label}>GitHub</Text>
                <Text style={styles.value} numberOfLines={1}>{formData.github || "Add Profile"}</Text>
              </View>
            </View>
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>

        </View>
      </View>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
      
      <Text style={styles.version}>Version 1.0.2</Text>


      {/* --- MODALS FOR EDITING --- */}

      {/* 1. NAME MODAL */}
      <EditModal 
        visible={editField === 'name'} 
        title="Edit Name" 
        onCancel={() => setEditField(null)} 
        onSave={handleSave}
      >
        <TextInput 
          style={styles.inputField} 
          placeholder="First Name" 
          value={tempValue.firstName} 
          onChangeText={t => setTempValue({...tempValue, firstName: t})} 
        />
        <TextInput 
          style={[styles.inputField, {marginTop: 10}]} 
          placeholder="Last Name" 
          value={tempValue.lastName} 
          onChangeText={t => setTempValue({...tempValue, lastName: t})} 
        />
      </EditModal>

      {/* 2. GENERIC TEXT MODAL (Mobile, RegNo, Socials) */}
      <EditModal 
        visible={['mobile', 'registerNo', 'linkedin', 'github'].includes(editField || "")} 
        title={`Edit ${editField?.toUpperCase()}`} 
        onCancel={() => setEditField(null)} 
        onSave={handleSave}
      >
        <TextInput 
          style={styles.inputField} 
          placeholder={`Enter ${editField}`} 
          value={tempValue.value} 
          onChangeText={t => setTempValue({...tempValue, value: t})} 
          keyboardType={editField === 'mobile' ? 'phone-pad' : 'default'}
        />
      </EditModal>

      {/* 3. DATE MODAL (Birthday) */}
      <EditModal 
        visible={editField === 'birthday'} 
        title="Edit Birthday" 
        onCancel={() => setEditField(null)} 
        onSave={handleSave}
      >
        <TextInput 
          style={styles.inputField} 
          placeholder="YYYY-MM-DD" 
          value={tempValue.value} 
          onChangeText={t => setTempValue({...tempValue, value: t})} 
        />
        <Text style={styles.hintText}>Format: YYYY-MM-DD</Text>
      </EditModal>

      {/* 4. GENDER MODAL */}
      <EditModal 
        visible={editField === 'gender'} 
        title="Select Gender" 
        onCancel={() => setEditField(null)} 
        onSave={handleSave}
      >
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          {['Male', 'Female', 'Other'].map(g => (
            <TouchableOpacity 
              key={g} 
              style={[styles.optionBtn, tempValue.value === g && styles.optionBtnSelected]}
              onPress={() => setTempValue({value: g})}
            >
              <Text style={[styles.optionText, tempValue.value === g && styles.optionTextSelected]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </EditModal>

      {/* 5. ACADEMIC MODAL (Hierarchy) */}
      <EditModal 
        visible={editField === 'academic'} 
        title="Academic Details" 
        onCancel={() => setEditField(null)} 
        onSave={handleSave}
      >
        {/* Batch Selector */}
        <Text style={styles.selectLabel}>Batch</Text>
        <ScrollView horizontal style={styles.chipRow}>
          {Object.keys(hierarchy || {}).map(b => (
            <TouchableOpacity 
              key={b} 
              style={[styles.chip, tempValue.batch === b && styles.chipSelected]}
              onPress={() => setTempValue({...tempValue, batch: b, department: "", section: ""})}
            >
              <Text style={[styles.chipText, tempValue.batch === b && styles.chipTextSelected]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Dept Selector */}
        {tempValue.batch && (
          <>
            <Text style={styles.selectLabel}>Department</Text>
            <ScrollView horizontal style={styles.chipRow}>
              {Object.keys(hierarchy[tempValue.batch] || {}).filter(d => d !== 'initialized').map(d => (
                <TouchableOpacity 
                  key={d} 
                  style={[styles.chip, tempValue.department === d && styles.chipSelected]}
                  onPress={() => setTempValue({...tempValue, department: d, section: ""})}
                >
                  <Text style={[styles.chipText, tempValue.department === d && styles.chipTextSelected]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Section Selector */}
        {tempValue.department && (
          <>
            <Text style={styles.selectLabel}>Section</Text>
            <ScrollView horizontal style={styles.chipRow}>
              {hierarchy[tempValue.batch]?.[tempValue.department]?.map((s: string) => (
                <TouchableOpacity 
                  key={s} 
                  style={[styles.chip, tempValue.section === s && styles.chipSelected]}
                  onPress={() => setTempValue({...tempValue, section: s})}
                >
                  <Text style={[styles.chipText, tempValue.section === s && styles.chipTextSelected]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}
      </EditModal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { alignItems: 'center', padding: 30, backgroundColor: '#fff', marginBottom: 20 },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center', marginBottom: 15, position: 'relative' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#007AFF' },
  syncBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#007AFF', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  email: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  
  section: { marginBottom: 25, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, color: '#6D6D72', marginBottom: 8, marginLeft: 16, fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  label: { fontSize: 12, color: '#8E8E93', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 16, color: '#000', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginLeft: 50 },

  logoutBtn: { marginHorizontal: 16, backgroundColor: '#fff', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: '#C7C7CC', fontSize: 12, marginBottom: 100 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 250 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputField: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 10, fontSize: 16 },
  hintText: { fontSize: 12, color: '#888', marginTop: 5, textAlign: 'center' },
  
  modalActions: { flexDirection: 'row', marginTop: 20, gap: 10 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#E5E5EA' },
  saveBtn: { backgroundColor: '#007AFF' },
  cancelBtnText: { color: '#000', fontWeight: '600' },
  saveBtnText: { color: '#fff', fontWeight: '600' },

  // Selection Chips
  selectLabel: { fontSize: 14, fontWeight: '600', marginTop: 15, marginBottom: 8, color: '#666' },
  chipRow: { flexDirection: 'row', marginBottom: 5 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F2F2F7', borderRadius: 20, marginRight: 10 },
  chipSelected: { backgroundColor: '#007AFF' },
  chipText: { color: '#000' },
  chipTextSelected: { color: '#fff', fontWeight: '600' },

  // Gender Options
  optionBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  optionBtnSelected: { borderColor: '#007AFF', backgroundColor: '#EFF6FF' },
  optionText: { color: '#000' },
  optionTextSelected: { color: '#007AFF', fontWeight: 'bold' }
});
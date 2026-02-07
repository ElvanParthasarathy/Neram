import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Alert, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut, updateProfile } from 'firebase/auth';
import { ref, onValue, update } from 'firebase/database';
import { auth, db } from '../services/firebase';
import { useGlobal } from '../context/GlobalContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { formatDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { createProfileStyles } from '../styles/ProfileStyles';
import UserDirectoryScreen from './UserDirectoryScreen';

const COUNTRY_CODES = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA' },
    { code: '+44', country: 'UK' },
    { code: '+971', country: 'UAE' },
    { code: '+65', country: 'Singapore' }
];

export default function ProfileScreen() {
    const navigation = useNavigation();
    const { user } = useGlobal();
    const { colors } = useTheme();
    const styles = useMemo(() => createProfileStyles(colors), [colors]);

    // --- STATE ---
    const [formData, setFormData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [hierarchy, setHierarchy] = useState({});
    const [editing, setEditing] = useState({});

    const [nameData, setNameData] = useState({ first: '', last: '' });
    const [countryCode, setCountryCode] = useState('+91');
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'directory'

    // Modals
    const [modalConfig, setModalConfig] = useState({ visible: false, title: '', data: [], onSelect: null });
    const [isDOBPickerVisible, setDOBPickerVisible] = useState(false);
    const [dobYearView, setDobYearView] = useState(false); // Toggle between Year list and Calendar

    useEffect(() => {
        if (!user) return;

        // 1. Load Academic Hierarchy
        const hierarchyRef = ref(db, 'academic_hierarchy');
        const unsubHierarchy = onValue(hierarchyRef, (snap) => {
            if (snap.exists()) setHierarchy(snap.val());
        });

        // 2. Load User Profile
        const userRef = ref(db, `users/${user.uid}`);
        const unsub = onValue(userRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setFormData(data);
                setOriginalData(data);
                // Extract mobile code if possible, or default
                // Assuming mobile in DB is just number, we default +91. 
                // If you store code separately, load it here.
            }
        });

        return () => {
            unsubHierarchy();
            unsub();
        };
    }, [user]);

    // --- LOGIC ---
    const toggleEdit = (field) => {
        if (field === 'name') {
            if (formData.firstName || formData.lastName) {
                setNameData({ first: formData.firstName || "", last: formData.lastName || "" });
            } else {
                const full = formData.displayName || "";
                const lastSpace = full.lastIndexOf(" ");
                if (lastSpace === -1) setNameData({ first: full, last: "" });
                else setNameData({ first: full.substring(0, lastSpace), last: full.substring(lastSpace + 1) });
            }
        }
        setEditing(prev => ({ ...prev, [field]: true }));
    };

    const cancelEdit = (field) => {
        if (field === 'academic') {
            setFormData(prev => ({
                ...prev,
                batch: originalData.batch || '',
                department: originalData.department || '',
                section: originalData.section || ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: originalData[field] || '' }));
        }
        setEditing(prev => ({ ...prev, [field]: false }));
    };

    const handleSave = async (field) => {
        try {
            let updateObj = {};

            if (field === 'name') {
                const full = `${nameData.first} ${nameData.last}`.trim();
                await updateProfile(user, { displayName: full });
                updateObj = { displayName: full, firstName: nameData.first, lastName: nameData.last };
            }
            else if (field === 'academic') {
                updateObj = { batch: formData.batch, department: formData.department, section: formData.section };
            }
            else {
                updateObj = { [field]: formData[field] };
            }

            await update(ref(db, `users/${user.uid}`), updateObj);
            setEditing(prev => ({ ...prev, [field]: false }));
            Alert.alert("Success", "Profile updated.");
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    const handleSyncPhoto = async () => {
        const googleProvider = user?.providerData.find(p => p.providerId === 'google.com');
        if (googleProvider?.photoURL) {
            try {
                await update(ref(db, `users/${user.uid}`), { photoURL: googleProvider.photoURL });
                Alert.alert("Synced", "Photo updated from Google.");
            } catch (e) {
                Alert.alert("Error", e.message);
            }
        } else {
            Alert.alert("Info", "No Google photo found.");
        }
    };

    const handleLogout = () => {
        Alert.alert("Sign Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign Out", style: "destructive", onPress: () => signOut(auth) }
        ]);
    };

    // --- MODAL HELPERS ---
    const openSelector = (title, data, onSelect) => {
        setModalConfig({ visible: true, title, data, onSelect });
    };

    // --- ACADEMIC LOGIC ---
    const getBatches = () => Object.keys(hierarchy);
    const getDepartments = (batch) => batch && hierarchy[batch] ? Object.keys(hierarchy[batch]) : [];
    const getSections = (batch, dept) => batch && dept && hierarchy[batch]?.[dept] ? hierarchy[batch][dept] : [];

    // --- YEAR GENERATOR ---
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const start = 1980;
        const arr = [];
        for (let i = currentYear; i >= start; i--) arr.push(String(i));
        return arr;
    }, []);

    // --- RENDER HELPERS ---
    const RenderRow = ({ label, icon, field, renderEdit, renderValue }) => {
        const isEditing = editing[field];
        return (
            <View style={styles.rowCard}>
                <View style={styles.labelRow}>
                    <Ionicons name={icon} size={16} color={colors.textSecondary} />
                    <Text style={styles.labelText}>{label}</Text>
                </View>
                {!isEditing ? (
                    <View style={styles.readRow}>
                        <Text style={styles.valueText} numberOfLines={1}>{renderValue || "Not Set"}</Text>
                        <TouchableOpacity style={styles.editBtn} onPress={() => toggleEdit(field)}>
                            <Ionicons name="pencil" size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.editContainer}>
                        {renderEdit}
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelEdit(field)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={() => handleSave(field)}>
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            {/* TAB SWITCHER */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'profile' && styles.activeTab]}
                    onPress={() => setActiveTab('profile')}
                >
                    <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>My Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'directory' && styles.activeTab]}
                    onPress={() => setActiveTab('directory')}
                >
                    <Text style={[styles.tabText, activeTab === 'directory' && styles.activeTabText]}>Directory</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'profile' ? (
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    {/* PHOTO */}
                    <View style={styles.photoSection}>
                        {formData.photoURL ? (
                            <Image source={{ uri: formData.photoURL }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{(formData.displayName || user?.email || "U")[0].toUpperCase()}</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.syncBtn} onPress={handleSyncPhoto}>
                            <Ionicons name="refresh" size={16} color={colors.textPrimary} />
                            <Text style={styles.syncBtnText}>Sync Google Photo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* NAME */}
                    <RenderRow
                        label="Name"
                        icon="person-outline"
                        field="name"
                        renderValue={formData.displayName}
                        renderEdit={
                            <View style={styles.rowInputs}>
                                <TextInput
                                    style={[styles.input, styles.inputFlex]}
                                    value={nameData.first}
                                    placeholder="First Name"
                                    onChangeText={t => setNameData(p => ({ ...p, first: t }))}
                                />
                                <TextInput
                                    style={[styles.input, styles.inputFlex]}
                                    value={nameData.last}
                                    placeholder="Last Name"
                                    onChangeText={t => setNameData(p => ({ ...p, last: t }))}
                                />
                            </View>
                        }
                    />

                    {/* MOBILE (With Country Code) */}
                    <RenderRow
                        label="Mobile"
                        icon="call-outline"
                        field="mobile"
                        renderValue={formData.mobile ? `${countryCode} ${formData.mobile}` : null} // Using logic code, assume prefix handled 
                        renderEdit={
                            <View style={styles.mobileInputGroup}>
                                <TouchableOpacity
                                    style={styles.countryCodeBtn}
                                    onPress={() => openSelector("Select Country Code", COUNTRY_CODES.map(c => c.code), (c) => setCountryCode(c))}
                                >
                                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                                    <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.input, styles.inputFlex]}
                                    keyboardType="phone-pad"
                                    placeholder="Mobile Number"
                                    value={formData.mobile}
                                    onChangeText={t => setFormData(p => ({ ...p, mobile: t }))}
                                />
                            </View>
                        }
                    />

                    {/* ACADEMIC DETAILS (Cascading Selectors) */}
                    <RenderRow
                        label="Academic Details"
                        icon="school-outline"
                        field="academic"
                        renderValue={formData.batch ? `${formData.batch} | ${formData.department} | ${formData.section}` : null}
                        renderEdit={
                            <View style={styles.gap8}>
                                {/* BATCH */}
                                <TouchableOpacity
                                    style={styles.selectorBtn}
                                    onPress={() => openSelector("Select Batch", getBatches(), (val) => {
                                        setFormData(p => ({ ...p, batch: val, department: '', section: '' }));
                                    })}
                                >
                                    <Text style={formData.batch ? styles.selectorValue : styles.selectorPlaceholder}>
                                        {formData.batch || "Select Batch"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>

                                {/* DEPT */}
                                <TouchableOpacity
                                    style={[styles.selectorBtn, !formData.batch && styles.opacityHalf]}
                                    disabled={!formData.batch}
                                    onPress={() => openSelector("Select Department", getDepartments(formData.batch), (val) => {
                                        setFormData(p => ({ ...p, department: val, section: '' }));
                                    })}
                                >
                                    <Text style={formData.department ? styles.selectorValue : styles.selectorPlaceholder}>
                                        {formData.department || "Select Department"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>

                                {/* SECTION */}
                                <TouchableOpacity
                                    style={[styles.selectorBtn, !formData.department && styles.opacityHalf]}
                                    disabled={!formData.department}
                                    onPress={() => openSelector("Select Section", getSections(formData.batch, formData.department), (val) => {
                                        setFormData(p => ({ ...p, section: val }));
                                    })}
                                >
                                    <Text style={formData.section ? styles.selectorValue : styles.selectorPlaceholder}>
                                        {formData.section || "Select Section"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        }
                    />

                    {/* REGISTER NO & GENDER & OTHERS (Existing logic) */}
                    <RenderRow
                        label="Register No"
                        icon="grid-outline"
                        field="registerNo"
                        renderValue={formData.registerNo}
                        renderEdit={
                            <TextInput
                                style={styles.input}
                                placeholder="Register Number"
                                value={formData.registerNo}
                                onChangeText={t => setFormData(p => ({ ...p, registerNo: t }))}
                            />
                        }
                    />

                    {/* DATE OF BIRTH (With Year Picker) */}
                    <RenderRow
                        label="Date of Birth"
                        icon="calendar-outline"
                        field="birthday"
                        renderValue={formatDate(formData.birthday)}
                        renderEdit={
                            <TouchableOpacity onPress={() => { setDOBPickerVisible(true); setDobYearView(false); }}>
                                <View pointerEvents="none">
                                    <TextInput
                                        style={styles.input}
                                        placeholder="DD-MM-YYYY"
                                        value={formatDate(formData.birthday)}
                                        editable={false}
                                    />
                                </View>
                            </TouchableOpacity>
                        }
                    />

                    {/* GENDER */}
                    <RenderRow
                        label="Gender"
                        icon="people-circle-outline"
                        field="gender"
                        renderValue={formData.gender}
                        renderEdit={
                            <View style={styles.genderContainer}>
                                {['Male', 'Female', 'Other'].map(opt => (
                                    <TouchableOpacity
                                        key={opt}
                                        onPress={() => setFormData(p => ({ ...p, gender: opt }))}
                                        style={[
                                            styles.input,
                                            styles.genderOption,
                                            formData.gender === opt && styles.genderOptionActive
                                        ]}
                                    >
                                        <Text style={[styles.genderText, formData.gender === opt && styles.genderTextActive]}>{opt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        }
                    />

                    {/* SOCIALS */}
                    <RenderRow
                        label="LinkedIn"
                        icon="logo-linkedin"
                        field="linkedin"
                        renderValue={formData.linkedin}
                        renderEdit={<TextInput style={styles.input} placeholder="https://linkedin.com/..." value={formData.linkedin} onChangeText={t => setFormData(p => ({ ...p, linkedin: t }))} autoCapitalize="none" />}
                    />

                    <RenderRow
                        label="GitHub"
                        icon="logo-github"
                        field="github"
                        renderValue={formData.github}
                        renderEdit={<TextInput style={styles.input} placeholder="https://github.com/..." value={formData.github} onChangeText={t => setFormData(p => ({ ...p, github: t }))} autoCapitalize="none" />}
                    />



                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <Text style={styles.version}>Neram Mobile v1.1.0</Text>
                </ScrollView>
            ) : (
                <View style={styles.directoryContainer}>
                    <UserDirectoryScreen key="user-dir-v2" embedded={true} navigation={navigation} />
                </View>
            )}

            {/* --- MODALS --- */}

            {/* 1. Generic Selector Modal */}
            <Modal transparent visible={modalConfig.visible} animationType="slide" onRequestClose={() => setModalConfig({ ...modalConfig, visible: false })}>
                <TouchableOpacity style={styles.backdrop} onPress={() => setModalConfig({ ...modalConfig, visible: false })}>
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{modalConfig.title}</Text>
                            <TouchableOpacity onPress={() => setModalConfig({ ...modalConfig, visible: false })}>
                                <Text style={styles.closeText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={modalConfig.data}
                            keyExtractor={(item) => item.toString()}
                            contentContainerStyle={styles.list}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => {
                                        modalConfig.onSelect(item);
                                        setModalConfig({ ...modalConfig, visible: false });
                                    }}
                                >
                                    <Text style={styles.optionText}>{item}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.inputBorder} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* 2. DOB Picker Modal */}
            <Modal transparent visible={isDOBPickerVisible} animationType="slide" onRequestClose={() => setDOBPickerVisible(false)}>
                <TouchableOpacity style={styles.backdrop} onPress={() => setDOBPickerVisible(false)}>
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{dobYearView ? "Select Year" : "Select Date"}</Text>
                            <View style={styles.headerActions}>
                                <TouchableOpacity onPress={() => setDobYearView(!dobYearView)}>
                                    <Text style={styles.actionText}>{dobYearView ? "View Calendar" : "Change Year"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setDOBPickerVisible(false)}>
                                    <Text style={styles.closeText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* YEAR LIST OR CALENDAR */}
                        {dobYearView ? (
                            <FlatList
                                data={years}
                                keyExtractor={(item) => item.toString()}
                                style={styles.yearList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.yearItem, formData.birthday?.startsWith(item) && styles.activeYear]}
                                        onPress={() => {
                                            // Pre-select Jan 1st of that year to jump the calendar
                                            // logic handled by just switching view, keeping 'current' updated
                                            // Or we can construct a fake date
                                            setFormData(p => ({ ...p, birthday: `${item}-01-01` })); // Jump to year
                                            setDobYearView(false);
                                        }}
                                    >
                                        <Text style={[styles.optionText, formData.birthday?.startsWith(item) && styles.activeYearText]}>{item}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        ) : (
                            <Calendar
                                current={formData.birthday || new Date().toISOString().split('T')[0]}
                                onDayPress={(day) => {
                                    setFormData(p => ({ ...p, birthday: day.dateString }));
                                    // Optional: Don't auto close, let them click Done
                                }}
                                theme={{
                                    todayTextColor: colors.accent,
                                    arrowColor: colors.accent,
                                    textDayFontWeight: '600',
                                }}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView >
    );
}

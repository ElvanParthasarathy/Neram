import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../../services/firebase';
import { ref, onValue, update } from 'firebase/database';
import { adminEmails } from '../../data/admins';
import { useTheme } from '../../context/ThemeContext';

import { createAdminRoleManagerStyles } from '../../styles/AdminRoleManagerStyles';

const ROLES = [
    { id: 'admin', label: 'Admin', color: '#6366F1' },
    { id: 'cr', label: 'Class Rep (CR)', color: '#F59E0B' },
    { id: 'student', label: 'Student', color: '#9CA3AF' },
];

export default function AdminRoleManagerScreen({ navigation }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createAdminRoleManagerStyles(colors), [colors]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null); // For modal

    // Hierarchy State
    const [path, setPath] = useState([]); // ['2023-2027', 'CSE', 'A']

    // 1. Fetch Users & Build Hierarchy
    useEffect(() => {
        const usersRef = ref(db, 'users');
        const unsub = onValue(usersRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                const list = Object.keys(data).map(uid => ({ uid, ...data[uid] }));
                setAllUsers(list);
            } else {
                setAllUsers([]);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    // 2. Computed Hierarchy based on ALL users
    const hierarchy = useMemo(() => {
        const tree = {};
        const others = [];

        allUsers.forEach(u => {
            if (u.batch && u.department && u.section) {
                if (!tree[u.batch]) tree[u.batch] = {};
                if (!tree[u.batch][u.department]) tree[u.batch][u.department] = {};
                if (!tree[u.batch][u.department][u.section]) tree[u.batch][u.department][u.section] = [];
                tree[u.batch][u.department][u.section].push(u);
            } else {
                others.push(u);
            }
        });

        // Sort users in each leaf
        const sortUsers = (list) => list.sort((a, b) => {
            const roleScore = (r) => r === 'admin' ? 3 : r === 'cr' ? 2 : 0;
            return roleScore(b.role) - roleScore(a.role) || (a.displayName || '').localeCompare(b.displayName || '');
        });

        // Deep sort logic could go here, but doing it JIT is fine
        return { tree, others: sortUsers(others) };
    }, [allUsers]);

    // 3. Get Current View Data
    const currentViewData = useMemo(() => {
        if (search.trim()) {
            // Flat Search Mode
            const low = search.toLowerCase();
            return allUsers.filter(u =>
                (u.displayName || '').toLowerCase().includes(low) ||
                (u.email || '').toLowerCase().includes(low)
            );
        }

        const { tree, others } = hierarchy;

        // Root Level
        if (path.length === 0) {
            const batches = Object.keys(tree).sort().reverse().map(b => ({ type: 'folder', name: b, count: 0 })); // Count logic complex, skipping for speed
            const special = others.length > 0 ? [{ type: 'folder', name: 'Unassigned', isOthers: true }] : [];
            return [...batches, ...special];
        }

        // Drill Down
        let pointer = tree;
        for (let p of path) {
            if (p === 'Unassigned') return others; // Should verify path logic
            pointer = pointer[p];
            if (!pointer) return [];
        }

        if (Array.isArray(pointer)) {
            // We are at user list level (Leaf)
            return pointer;
        } else {
            // We are at folder level
            return Object.keys(pointer).sort().map(k => ({ type: 'folder', name: k }));
        }

    }, [search, allUsers, hierarchy, path]);

    // Update Role
    const handleUpdateRole = async (uid, newRole) => {
        try {
            await update(ref(db, `users/${uid}`), { role: newRole });
            Alert.alert("Success", "User role updated successfully.");
            setSelectedUser(null);
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    };

    const renderRoleBadge = (role) => {
        const r = ROLES.find(x => x.id === (role || 'student')) || ROLES[2];
        return (
            <View style={[styles.badge, { backgroundColor: r.color + '20' }]}>
                <Text style={[styles.badgeText, { color: r.color }]}>{r.label}</Text>
            </View>
        );
    };

    const handleFolderPress = (item) => {
        if (item.isOthers) {
            // Handle special logic if needed, or just treat name as key if 'Staff / Others' is unique enough
            // But 'tree' keys are batches (years). 'Staff / Others' won't match a year.
            // My drill down logic expects tree traversal. 
            // Let's modify logic slightly:
            if (path.length === 0 && item.isOthers) {
                // Special trap
                // We can't put 'Unassigned' in path because tree['Unassigned'] doesn't exist.
                // Let's handle it by creating a pseudo-path or separate state?
                // Simple hack: Just set path to ['Unassigned'] and handle it in getCurrentData
                setPath(['Unassigned']);
                return;
            }
        }
        setPath([...path, item.name]);
    };

    const handleBack = () => {
        if (path.length > 0) {
            setPath(path.slice(0, -1));
        } else {
            navigation.goBack();
        }
    };

    const renderFolder = ({ item }) => (
        <TouchableOpacity style={styles.folderGridItem} onPress={() => handleFolderPress(item)}>
            <View style={styles.folderIconLarge}>
                <Ionicons name="folder" size={40} color={colors.folderColor} />
            </View>
            <Text style={styles.folderLabel} numberOfLines={2}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderUser = ({ item }) => {
        const isSystemAdmin = adminEmails.includes(item.email);
        return (
            <TouchableOpacity
                style={[styles.userCard, isSystemAdmin && styles.systemAdminCard]}
                onPress={() => {
                    if (isSystemAdmin) {
                        Alert.alert("System Admin", "Locked.");
                        return;
                    }
                    setSelectedUser(item);
                }}
            >
                <View style={styles.avatar}>
                    {item.photoURL ? (
                        <Image source={{ uri: item.photoURL }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{(item.displayName || "U")[0].toUpperCase()}</Text>
                    )}
                    {isSystemAdmin && (
                        <View style={styles.lockBadge}>
                            <Ionicons name="lock-closed" size={10} color={colors.surface} />
                        </View>
                    )}
                </View>
                <View style={styles.flex1}>
                    <View style={styles.userRowHeader}>
                        <Text style={styles.userName}>{item.displayName || "Unknown"}</Text>
                        {isSystemAdmin ? (
                            <View style={styles.systemBadge}>
                                <Text style={styles.systemBadgeText}>SYSTEM</Text>
                            </View>
                        ) : (
                            renderRoleBadge(item.role)
                        )}
                    </View>
                    <Text style={styles.userEmail}>{item.email}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    // Determine if we are viewing folders or users
    const isFolderView = currentViewData.length > 0 && currentViewData[0].type === 'folder';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.flex1}>
                    <Text style={styles.title}>Role Manager</Text>
                    <Text style={styles.subtitle}>
                        {search ? "Searching..." : (path.length === 0 ? "Batches" : path.join(" > "))}
                    </Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search any user..."
                    placeholderTextColor={colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
            ) : (
                <View style={styles.flex1}>
                    {isFolderView ? (
                        <FlatList
                            key="folders"
                            data={currentViewData}
                            keyExtractor={item => item.name}
                            renderItem={renderFolder}
                            numColumns={3}
                            contentContainerStyle={styles.gridContent}
                            ListEmptyComponent={<Text style={styles.emptyText}>Nothing here.</Text>}
                        />
                    ) : (
                        <FlatList
                            key="users"
                            data={currentViewData}
                            keyExtractor={item => item.uid}
                            renderItem={renderUser}
                            contentContainerStyle={styles.list}
                            ListEmptyComponent={<Text style={styles.emptyText}>Nothing here.</Text>}
                        />
                    )}
                </View>
            )}

            {/* ROLE PICKER MODAL */}
            <Modal
                visible={!!selectedUser}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedUser(null)}
            >
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelectedUser(null)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Assign Role</Text>
                        <Text style={styles.modalSubtitle}>For {selectedUser?.displayName}</Text>

                        <View style={styles.roleGrid}>
                            {ROLES.map(role => (
                                <TouchableOpacity
                                    key={role.id}
                                    style={[
                                        styles.roleOption,
                                        selectedUser?.role === role.id && styles.roleOptionActive,
                                        { borderColor: selectedUser?.role === role.id ? role.color : colors.glassBorder }
                                    ]}
                                    onPress={() => handleUpdateRole(selectedUser.uid, role.id)}
                                >
                                    <View style={[styles.roleIcon, { backgroundColor: role.color }]}>
                                        <Ionicons name={role.id === 'admin' ? 'shield' : role.id === 'cr' ? 'star' : 'person'} size={20} color={colors.buttonText} />
                                    </View>
                                    <Text style={styles.roleLabel}>{role.label}</Text>
                                    {selectedUser?.role === role.id && (
                                        <Ionicons name="checkmark-circle" size={20} color={role.color} style={styles.checkIcon} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}



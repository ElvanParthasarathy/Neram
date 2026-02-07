import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { ref, onValue } from 'firebase/database';
import { useGlobal } from '../context/GlobalContext';
import { createUserDirectoryStyles } from '../styles/UserDirectoryStyles';

export default function UserDirectoryScreen({ navigation, embedded }) {
    const { userProfile } = useGlobal();
    const { colors } = useTheme();
    const styles = useMemo(() => createUserDirectoryStyles(colors), [colors]);
    const [hierarchy, setHierarchy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [path, setPath] = useState([]); // ['2023-2027', 'CSE', 'A']
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // 1. Fetch Hierarchy on Mount & Auto-set path
    useEffect(() => {
        const hRef = ref(db, 'academic_hierarchy');
        const unsub = onValue(hRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setHierarchy(data);

                // FIX: Set path immediately to avoid visual jump from Batch -> Dept
                if (userProfile?.batch && data[userProfile.batch]) {
                    setPath([userProfile.batch]);
                }
            }
            setLoading(false);
        });
        return unsub;
    }, [userProfile?.batch]); // Re-run if batch changes (unlikely but safe)

    // 2. Handle Back Button (Android Hardware + Custom)
    const handleBack = useCallback(() => {
        // If user has a locked batch, treat length 1 as root
        const minLength = userProfile?.batch ? 1 : 0;

        if (path.length > minLength) {
            setPath(prev => prev.slice(0, -1));
            return true; // Prevent default back
        }
        if (embedded) return false; // Let parent handle it (or do nothing)
        return false; // Allow default back (exit screen)
    }, [path, embedded, userProfile]);

    useEffect(() => {
        if (embedded) return; // Don't hijack hardware back if embedded (tabs usually don't)
        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);
        return () => backHandler.remove();
    }, [handleBack, embedded]);

    // 3. Fetch Users when reaching Section level (Leaf)
    useEffect(() => {
        if (path.length === 3) {
            setUsersLoading(true);
            const usersRef = ref(db, 'users');
            // Optimization: Fetching all for now as per web, but filtering client side.
            // In production with 10k users, this should be a query.
            onValue(usersRef, (snap) => {
                if (snap.exists()) {
                    const data = snap.val();
                    const [batch, department, section] = path;
                    const filtered = Object.values(data).filter(u =>
                        u.batch === batch &&
                        u.department === department &&
                        u.section === section
                    );
                    setUsers(filtered.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || "")));
                } else {
                    setUsers([]);
                }
                setUsersLoading(false);
            }, { onlyOnce: true }); // Fetch once per folder open
        }
    }, [path]);

    // ---------------- RENDER HELPERS ----------------

    const getCurrentItems = () => {
        if (!hierarchy) return [];
        if (path.length === 0) {
            const allBatches = Object.keys(hierarchy).sort().reverse();
            // If user has a batch assigned, show ONLY that batch
            if (userProfile?.batch && hierarchy[userProfile.batch]) {
                return [userProfile.batch];
            }
            return allBatches;
        }
        if (path.length === 1) {
            const batchData = hierarchy[path[0]];
            return batchData ? Object.keys(batchData).filter(k => k !== 'initialized') : []; // Departments
        }
        if (path.length === 2) {
            const deptData = hierarchy[path[0]][path[1]];
            return deptData || []; // Sections
        }
        return []; // Users (handled separately)
    };

    const handleFolderPress = (item) => {
        setPath([...path, item]);
    };

    const getBreadcrumb = () => {
        if (path.length === 0) return "Batches";
        return path.join(" / ");
    };

    const renderFolder = ({ item }) => (
        <TouchableOpacity style={styles.folderCard} onPress={() => handleFolderPress(item)}>
            <Ionicons name="folder" size={40} color={colors.folderColor} />
            <Text style={styles.folderName}>{item}</Text>
        </TouchableOpacity>
    );

    const renderUser = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
                {item.photoURL ? (
                    <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={20} color={colors.textSecondary} />
                    </View>
                )}
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.displayName || "Unknown"}</Text>
                <Text style={styles.userReg}>{item.registerNo || "No Reg No"}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const Wrapper = embedded ? View : SafeAreaView;
    const wrapperProps = embedded ? { style: styles.container } : { style: styles.container, edges: ['left', 'right'] };

    return (
        <Wrapper {...wrapperProps}>
            {!embedded || path.length > 0 ? (
                <View style={embedded ? styles.headerEmbedded : styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            if (path.length > (userProfile?.batch ? 1 : 0)) handleBack();
                            else if (!embedded) navigation.goBack();
                        }}
                        style={[styles.backButton, (embedded && path.length <= (userProfile?.batch ? 1 : 0)) && styles.hidden]}
                        disabled={embedded && path.length <= (userProfile?.batch ? 1 : 0)}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View>
                        {!embedded && <Text style={styles.title}>User Directory</Text>}
                        <Text style={styles.subtitle}>{getBreadcrumb()}</Text>
                    </View>
                </View>
            ) : null}

            {path.length < 3 ? (
                // FOLDER VIEW
                <FlatList
                    key="folders"
                    data={getCurrentItems()}
                    keyExtractor={item => item}
                    renderItem={renderFolder}
                    numColumns={3}
                    contentContainerStyle={styles.gridContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>Nothing here.</Text>}
                    removeClippedSubviews={true}
                    initialNumToRender={12}
                    windowSize={5}
                />
            ) : (
                // USER LIST VIEW
                usersLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.marginTop40} />
                ) : (
                    <FlatList
                        key="users"
                        data={users}
                        keyExtractor={(item, index) => item.uid || index.toString()}
                        renderItem={renderUser}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={<Text style={styles.emptyText}>No users found in this section.</Text>}
                        removeClippedSubviews={true}
                        initialNumToRender={10}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                    />
                )
            )}
        </Wrapper>
    );
}

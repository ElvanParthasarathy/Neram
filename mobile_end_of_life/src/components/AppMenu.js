import React, { useState, useMemo } from 'react'; // Refactor Fix
import { View, Text, Modal, Linking, Alert } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import PreviewSystemModal from './PreviewSystemModal';

import { createAppMenuStyles } from '../styles/NavigationStyles';

export default function AppMenu() {
    const navigation = useNavigation();
    const { userProfile, isPreviewing } = useGlobal();
    const { colors, changeTheme, themePreference } = useTheme();
    const [isMenuVisible, setMenuVisible] = useState(false);
    const [isPreviewVisible, setPreviewVisible] = useState(false);
    const [menuView, setMenuView] = useState('main'); // 'main' | 'appearance'

    const styles = useMemo(() => createAppMenuStyles(colors), [colors]);

    return (
        <>
            <View style={styles.menuRow}>
                {/* PREVIEW BADGE */}
                {isPreviewing && (
                    <AnimatedPressable
                        style={styles.previewBadge}
                        activeScale={0.95}
                        onPress={() => setPreviewVisible(true)}
                    >
                        <Ionicons name="eye" size={12} color="#fff" />
                        <Text style={styles.previewText}>PREVIEW</Text>
                    </AnimatedPressable>
                )}

                <AnimatedPressable activeScale={0.9} onPress={() => { setMenuView('main'); setMenuVisible(true); }}>
                    <Ionicons name="ellipsis-vertical" size={24} color={colors.textPrimary} />
                </AnimatedPressable>
            </View>

            <Modal
                transparent={true}
                visible={isMenuVisible}
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <AnimatedPressable
                    style={styles.menuBackdrop}
                    activeScale={1}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        {menuView === 'main' ? (
                            <>
                                <AnimatedPressable style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('CollegeSites'); }}>
                                    <Ionicons name="globe-outline" size={20} style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Important Sites</Text>
                                </AnimatedPressable>
                                <AnimatedPressable style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Contact'); }}>
                                    <Ionicons name="mail-outline" size={20} style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Contact</Text>
                                </AnimatedPressable>
                                <AnimatedPressable style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Settings'); }}>
                                    <Ionicons name="settings-outline" size={20} style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Settings</Text>
                                </AnimatedPressable>

                                {['admin', 'cr'].includes(userProfile?.role) && (
                                    <>
                                        <View style={styles.menuDivider} />
                                        <AnimatedPressable style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('AdminDashboard'); }}>
                                            <Ionicons name="shield-checkmark-outline" size={20} style={styles.menuIcon} />
                                            <Text style={styles.menuText}>Admin Panel</Text>
                                        </AnimatedPressable>
                                        <AnimatedPressable style={styles.menuItem} onPress={() => { setMenuVisible(false); setPreviewVisible(true); }}>
                                            <Ionicons name="eye-outline" size={20} style={styles.menuIcon} />
                                            <Text style={styles.menuText}>Preview System</Text>
                                        </AnimatedPressable>
                                    </>
                                )}

                                <View style={styles.menuDivider} />
                                <AnimatedPressable style={styles.menuItem} onPress={() => setMenuView('appearance')}>
                                    <Ionicons name="moon-outline" size={20} style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Appearance</Text>
                                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                </AnimatedPressable>
                            </>
                        ) : (
                            <>
                                <AnimatedPressable style={styles.menuHeader} onPress={() => setMenuView('main')}>
                                    <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                                    <Text style={styles.menuBackText}>Back</Text>
                                </AnimatedPressable>
                                <View style={styles.menuDivider} />
                                <AnimatedPressable style={styles.menuItem} onPress={() => changeTheme('auto')}>
                                    <Ionicons name="phone-portrait-outline" size={20} style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Auto System</Text>
                                    {themePreference === 'auto' && <Ionicons name="checkmark" size={16} color={colors.accent} />}
                                </AnimatedPressable>
                                <AnimatedPressable style={styles.menuItem} onPress={() => changeTheme('light')}>
                                    <Ionicons name="sunny-outline" size={20} style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Light Mode</Text>
                                    {themePreference === 'light' && <Ionicons name="checkmark" size={16} color={colors.accent} />}
                                </AnimatedPressable>
                                <AnimatedPressable style={styles.menuItem} onPress={() => changeTheme('dark')}>
                                    <Ionicons name="moon-outline" size={20} style={styles.menuIcon} />
                                    <Text style={styles.menuText}>Dark Mode</Text>
                                    {themePreference === 'dark' && <Ionicons name="checkmark" size={16} color={colors.accent} />}
                                </AnimatedPressable>
                            </>
                        )}
                    </View>
                </AnimatedPressable>
            </Modal>

            <PreviewSystemModal
                visible={isPreviewVisible}
                onClose={() => setPreviewVisible(false)}
            />
        </>
    );
}



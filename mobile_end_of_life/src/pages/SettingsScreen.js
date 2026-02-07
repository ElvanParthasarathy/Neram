import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../services/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail, deleteUser, linkWithPopup, unlink, GoogleAuthProvider } from 'firebase/auth';
import { ref, remove } from 'firebase/database';
import { createSettingsStyles } from '../styles/SettingsStyles';

export default function SettingsScreen({ navigation }) {
    const { colors, themePreference, changeTheme, isDark } = useTheme();
    const styles = useMemo(() => createSettingsStyles(colors), [colors]);
    const user = auth.currentUser;
    const [passwords, setPasswords] = useState({ current: '', next: '' });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 1. Forgot Password
    const handleForgotPassword = async () => {
        if (!user?.email) return;
        try {
            await sendPasswordResetEmail(auth, user.email);
            Alert.alert("Email Sent", `A password reset link has been sent to: ${user.email}`);
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    };

    // 2. Update Password
    const handlePasswordUpdate = async () => {
        if (!passwords.current || !passwords.next) {
            Alert.alert("Missing Fields", "Please fill both fields.");
            return;
        }
        setIsProcessing(true);
        try {
            const cred = EmailAuthProvider.credential(user.email, passwords.current);
            await reauthenticateWithCredential(user, cred);
            await updatePassword(user, passwords.next);
            Alert.alert("Success", "Password Updated Successfully!");
            setPasswords({ current: '', next: '' });
        } catch (err) {
            Alert.alert("Update Failed", err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // 3. Delete Account
    const handleAccountDeletion = async () => {
        if (!passwords.current) {
            Alert.alert("Required", "Enter your current password to confirm deletion.");
            return;
        }

        Alert.alert(
            "Delete Account?",
            "This will permanently delete ALL your data. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsProcessing(true);
                        try {
                            const cred = EmailAuthProvider.credential(user.email, passwords.current);
                            await reauthenticateWithCredential(user, cred);

                            // Delete from DB
                            await remove(ref(db, `users/${user.uid}`));
                            // Delete Auth
                            await deleteUser(user);
                            // Navigation handles auth state change automatically via AppNavigator
                        } catch (err) {
                            Alert.alert("Deletion Failed", err.message);
                            setIsProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    const isGoogleLinked = user?.providerData.some(p => p.providerId === 'google.com');

    const handleGoogleLink = async () => {
        setIsProcessing(true);
        try {
            if (isGoogleLinked) {
                await unlink(user, 'google.com');
                Alert.alert("Success", "Google account unlinked successfully.");
            } else {
                // Note: linkWithPopup doesn't work well on RN with JS SDK. 
                // In a real native build, you'd use GoogleSignin.signIn() -> GoogleAuthProvider.credential -> linkWithCredential.
                // For now, we'll show the missing dependency alert as per task status.
                Alert.alert("Feature Pending", "Google Sign-In native module is not yet configured for this build.");

                // Code for reference if native module was present:
                // const provider = new GoogleAuthProvider();
                // await linkWithPopup(auth, provider); 
            }
        } catch (err) {
            Alert.alert("Error", err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Settings</Text>
                    <Text style={styles.subtitle}>Manage security & account</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>



                {/* 1. PASSWORD CHANGE */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="key-outline" size={22} color={colors.accent} />
                        <Text style={styles.sectionTitle}>Change Password</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Current Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showCurrent}
                                value={passwords.current}
                                placeholderTextColor={colors.placeholder}
                                onChangeText={t => setPasswords({ ...passwords, current: t })}
                                placeholder="••••••••"
                            />
                            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                                <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showNext}
                                value={passwords.next}
                                placeholderTextColor={colors.placeholder}
                                onChangeText={t => setPasswords({ ...passwords, next: t })}
                                placeholder="••••••••"
                            />
                            <TouchableOpacity onPress={() => setShowNext(!showNext)} style={styles.eyeIcon}>
                                <Ionicons name={showNext ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.btnRow}>
                        <TouchableOpacity
                            style={styles.updateBtn}
                            onPress={handlePasswordUpdate}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <ActivityIndicator color={colors.buttonText} /> : <Text style={styles.updateBtnText}>Update Password</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                            <Text style={styles.forgotBtnText}>Forgot Password?</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.infoText}>Use 6+ characters with mixed letters/numbers.</Text>
                    </View>
                </View>

                {/* 2. GOOGLE STATUS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="logo-google" size={22} color={colors.textPrimary} />
                        <Text style={styles.sectionTitle}>Social Authentication</Text>
                    </View>

                    <View style={styles.row}>
                        <Text style={styles.statusLabel}>Google Account:</Text>
                        <View style={[styles.badge, isGoogleLinked ? styles.badgeSuccess : styles.badgeNeutral]}>
                            <Text style={[styles.badgeText, isGoogleLinked ? styles.textSuccess : styles.textNeutral]}>
                                {isGoogleLinked ? "Linked" : "Not Linked"}
                            </Text>
                        </View>
                    </View>


                    <TouchableOpacity
                        style={[styles.socialBtn, isGoogleLinked ? styles.socialBtnDestructive : styles.socialBtnPrimary]}
                        onPress={handleGoogleLink}
                        disabled={isProcessing}
                    >
                        <Text style={[styles.socialBtnText, isGoogleLinked ? styles.textDestructive : styles.textPrimary]}>
                            {isGoogleLinked ? "Unlink Account" : "Link Google Account"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 3. DANGER ZONE */}
                <View style={[styles.section, styles.dangerSection]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
                        <Text style={[styles.sectionTitle, styles.textDanger]}>Danger Zone</Text>
                    </View>

                    {!showDeleteConfirm ? (
                        <View style={styles.dangerRow}>
                            <Text style={styles.dangerText}>Permanently delete account?</Text>
                            <TouchableOpacity style={styles.deleteBtn} onPress={() => setShowDeleteConfirm(true)}>
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.confirmBox}>
                            <Text style={styles.warningText}>Enter current password once more to confirm:</Text>
                            <TextInput
                                style={[styles.input, styles.dangerInput]}
                                secureTextEntry
                                placeholder="Confirm Password"
                                placeholderTextColor={colors.placeholder}
                                value={passwords.current}
                                onChangeText={t => setPasswords({ ...passwords, current: t })}
                            />
                            <View style={styles.confirmBtns}>
                                <TouchableOpacity style={styles.finalDeleteBtn} onPress={handleAccountDeletion}>
                                    <Text style={styles.finalDeleteText}>Confirm Deletion</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteConfirm(false)}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView >
    );
}

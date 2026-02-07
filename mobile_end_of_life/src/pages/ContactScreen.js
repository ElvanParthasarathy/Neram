import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createContactScreenStyles } from '../styles/ContactScreenStyles';

export default function ContactScreen({ navigation }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createContactScreenStyles(colors), [colors]);
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        email: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.mobile || !formData.email || !formData.message) {
            Alert.alert("Missing Fields", "Please fill in all fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, "messages"), {
                ...formData,
                timestamp: serverTimestamp(),
            });

            // Note: EmailJS integration is skipped for mobile as it requires API keys not present in this scope.
            // In a real app, you'd trigger a cloud function or use a specific mobile library.

            Alert.alert("Success", "Message sent successfully!");
            setFormData({ name: "", mobile: "", email: "", message: "" });
        } catch (error) {
            console.error("FAILED...", error);
            Alert.alert("Error", "Something went wrong. Please check your internet connection.");
        }

        setIsSubmitting(false);
    };

    const openLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* PAGE HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>Contact & Complaints</Text>
                        <Text style={styles.subtitle}>Reach out for queries, feedback, or grievance redressal.</Text>
                    </View>
                </View>

                {/* PROFILE SECTION */}
                <View style={styles.section}>
                    <Text style={styles.greeting}>Hello, I Am</Text>
                    <Text style={styles.namePrimary}>Jaiprakash Parthasarathy</Text>
                    <Text style={styles.nameAlias}>(Also known as: Elvan Parthasarathy)</Text>

                    <TouchableOpacity style={styles.portfolioBtn} onPress={() => openLink('https://jaiprakashpartha.vercel.app/')}>
                        <Text style={styles.portfolioBtnText}>Visit My Portfolio</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.buttonText} style={styles.marginLeft8} />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>Contact Info</Text>

                    <View style={styles.infoList}>
                        <TouchableOpacity style={styles.infoItem} onPress={() => openLink('tel:+919345128797')}>
                            <Ionicons name="call" size={20} color={colors.accent} />
                            <Text style={styles.infoText}>+91 93451 28797</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.infoItem} onPress={() => openLink('mailto:jaiprakashpartha@gmail.com')}>
                            <Ionicons name="mail" size={20} color={colors.accent} />
                            <Text style={styles.infoText}>jaiprakashpartha@gmail.com</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.infoItem} onPress={() => openLink('https://linkedin.com/in/jaiprakashpartha')}>
                            <Ionicons name="logo-linkedin" size={20} color={colors.accent} />
                            <Text style={styles.infoText}>/in/jaiprakashpartha</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.infoItem} onPress={() => openLink('https://github.com/elvanparthasarathy')}>
                            <Ionicons name="logo-github" size={20} color={colors.accent} />
                            <Text style={styles.infoText}>/elvanparthasarathy</Text>
                        </TouchableOpacity>

                        <View style={styles.infoItem}>
                            <Ionicons name="location" size={20} color={colors.accent} />
                            <View>
                                <Text style={styles.infoText}>Arani, Tamil Nadu - 632317</Text>
                                <Text style={styles.infoSubText}>(Currently in Chennai)</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* FORM SECTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Send a Message</Text>
                    <Text style={styles.formSubtitle}>Fill out the form below and it will reach me directly.</Text>

                    <View style={styles.formGroup}>
                        <TextInput
                            style={styles.input}
                            placeholder="Your Name"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.name}
                            onChangeText={(val) => handleChange('name', val)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Mobile Number"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="phone-pad"
                            value={formData.mobile}
                            onChangeText={(val) => handleChange('mobile', val)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(val) => handleChange('email', val)}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Your Message / Review / Query"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={4}
                            value={formData.message}
                            onChangeText={(val) => handleChange('message', val)}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={colors.buttonText} size="small" />
                            ) : (
                                <>
                                    <Text style={styles.submitBtnText}>Send Message</Text>
                                    <Ionicons name="send" size={18} color={colors.buttonText} style={styles.marginLeft8} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

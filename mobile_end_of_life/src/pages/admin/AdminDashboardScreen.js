import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useGlobal } from '../../context/GlobalContext';
import { useTheme } from '../../context/ThemeContext';

import { createAdminDashboardStyles } from '../../styles/AdminDashboardStyles';

const AdminMenu = [
    { title: "Role Manager", icon: "people-circle", route: "AdminRoleManager", color: "#6366F1" },
    { title: "Event Manager", icon: "calendar", route: "AdminEventManager", color: "#10B981" },
    { title: "Exam Manager", icon: "trophy", route: "AdminExamManager", color: "#F59E0B" },
    { title: "Schedule Manager", icon: "time", route: "AdminScheduleManager", color: "#EC4899" },
];

export default function AdminDashboardScreen({ navigation }) {
    const { userProfile } = useGlobal();
    const { colors } = useTheme();
    const styles = useMemo(() => createAdminDashboardStyles(colors), [colors]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Admin Panel</Text>
                    <Text style={styles.subtitle}>Manage App Content</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.grid}>
                {AdminMenu.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.card}
                        onPress={() => navigation.navigate(item.route)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                            <Ionicons name={item.icon} size={32} color={colors.buttonText} />
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardSubtitle}>Manage {item.title.split(' ')[0]}s</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}



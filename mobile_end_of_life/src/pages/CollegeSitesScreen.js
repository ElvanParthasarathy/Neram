import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createCollegeSitesScreenStyles } from '../styles/CollegeSitesScreenStyles';

const links = [
    {
        name: "RMD College Website",
        url: "https://rmd.ac.in/",
        description: "Official RMD college website.",
        icon: "business-outline" // ri-building-4-fill
    },
    {
        name: "ECE Digital Notes",
        url: "https://rmd.ac.in/dept/ece/notes.html",
        description: "Access the ECE department's digital notes.",
        icon: "book-outline" // ri-book-open-fill
    },
    {
        name: "RMK Nextgen Student",
        url: "https://nextgen.rmd.ac.in/",
        description: "Nextgen platform for student login and academic tracking.",
        icon: "person-outline" // ri-user-follow-fill
    },
    {
        name: "RMK Nextgen Faculty",
        url: "https://nextgenfaculty.rmd.ac.in/login.html",
        description: "Faculty login for RMK Nextgen academic management.",
        icon: "people-outline" // ri-team-fill
    },
    {
        name: "IamNeo",
        url: "https://rmk685.examly.io/login",
        description: "Learning, assessment, and recruitment solutions.",
        icon: "code-slash-outline" // ri-code-box-fill
    },
    {
        name: "Skill Rack",
        url: "https://www.skillrack.com/faces/ui/profile.xhtml",
        description: "Daily coding challenges and problem-solving tasks.",
        icon: "terminal-outline" // ri-terminal-box-fill
    },
    {
        name: "ChatGPT",
        url: "https://chatgpt.com/",
        description: "Access OpenAI's ChatGPT platform for conversational AI.",
        icon: "logo-electron" // ri-openai-fill (approx)
    },
    {
        name: "Code Tantra",
        url: "https://rmd.codetantra.com/",
        description: "Platform for classes, assignments, and assessments.",
        icon: "code-working-outline" // ri-code-s-slash-fill
    }
];

export default function CollegeSitesScreen({ navigation }) {
    const { colors } = useTheme();
    const styles = useMemo(() => createCollegeSitesScreenStyles(colors), [colors]);

    const openLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => openLink(item.url)} activeOpacity={0.7}>
            <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={24} color={colors.accent} />
            </View>
            <View style={styles.content}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header with Back Button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Important Sites</Text>
                    <Text style={styles.headerSubtitle}>Quick access to resources</Text>
                </View>
            </View>

            <FlatList
                data={links}
                keyExtractor={(item) => item.name}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

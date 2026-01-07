import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CollegeSitesScreen() {
  
  const links = [
    {
      name: "RMD College Website",
      url: "https://rmd.ac.in/",
      description: "Official RMD college website.",
      icon: "business", // Mapped from ri-building-4-fill
      color: "#4F46E5"
    },
    {
      name: "ECE Digital Notes",
      url: "https://rmd.ac.in/dept/ece/notes.html",
      description: "Access the ECE department's digital notes.",
      icon: "book", // Mapped from ri-book-open-fill
      color: "#EA580C"
    },
    {
      name: "RMK Nextgen Student",
      url: "https://nextgen.rmd.ac.in/",
      description: "Nextgen platform for student login and academic tracking.",
      icon: "school", // Mapped from ri-user-follow-fill
      color: "#2563EB"
    },
    {
      name: "RMK Nextgen Faculty",
      url: "https://nextgenfaculty.rmd.ac.in/login.html",
      description: "Faculty login for RMK Nextgen academic management.",
      icon: "people", // Mapped from ri-team-fill
      color: "#059669"
    },
    {
      name: "IamNeo",
      url: "https://rmk685.examly.io/login",
      description: "Learning, assessment, and recruitment solutions.",
      icon: "code-slash", // Mapped from ri-code-box-fill
      color: "#7C3AED"
    },
    {
      name: "Skill Rack",
      url: "https://www.skillrack.com/faces/ui/profile.xhtml",
      description: "Daily coding challenges and problem-solving tasks.",
      icon: "terminal", // Mapped from ri-terminal-box-fill
      color: "#DB2777"
    },
    {
      name: "ChatGPT",
      url: "https://chatgpt.com/",
      description: "Access OpenAI's ChatGPT platform for conversational AI.",
      icon: "hardware-chip", // Mapped from ri-openai-fill
      color: "#10B981"
    },
    {
      name: "Code Tantra",
      url: "https://rmd.codetantra.com/",
      description: "Platform for classes, assignments, and assessments.",
      icon: "laptop-outline", // Mapped from ri-code-s-slash-fill
      color: "#DC2626"
    }
  ];

  const handlePress = async (url: string) => {
    // Check if the device can open the URL
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log(`Don't know how to open this URL: ${url}`);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>College Sites & Platforms</Text>
          <Text style={styles.subtitle}>Quick access to essential academic resources</Text>
        </View>

        {/* Links Grid */}
        <View style={styles.grid}>
          {links.map((site, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.card} 
              onPress={() => handlePress(site.url)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${site.color}15` }]}>
                {/* @ts-ignore */}
                <Ionicons name={site.icon} size={28} color={site.color} />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.cardTitle}>{site.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{site.description}</Text>
              </View>
              
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={20} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollContent: { paddingBottom: 40 },
  
  header: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 20
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#6B7280' },

  grid: { paddingHorizontal: 20 },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#6B7280', lineHeight: 18 },
  
  arrowContainer: { marginLeft: 10 }
});
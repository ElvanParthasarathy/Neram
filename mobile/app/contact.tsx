import React, { useState } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  TextInput, Alert, Linking, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
// Ensure your firebase config exports 'firestore'
import { firestore } from '../config/firebase'; 
// import emailjs from '@emailjs/browser'; // Uncomment if you install the package

export default function ContactScreen() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePressLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Cannot open this link");
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    // Replace these with your actual keys or use Expo Constants
    const SERVICE_ID = "YOUR_SERVICE_ID";
    const ADMIN_TEMPLATE_ID = "YOUR_ADMIN_TEMPLATE_ID";
    const AUTO_REPLY_ID = "YOUR_AUTO_REPLY_ID";
    const PUBLIC_KEY = "YOUR_PUBLIC_KEY";

    const templateParams = {
      name: formData.name,
      mobile: formData.mobile, 
      email: formData.email,
      message: formData.message,
    };

    try {
      // 1. Save to Firestore
      // Ensure 'firestore' is initialized in your firebase.ts
      await addDoc(collection(firestore, "messages"), {
        ...formData,
        timestamp: serverTimestamp(),
      });

      // 2. Send Email (Uncomment if package is installed)
      // await emailjs.send(SERVICE_ID, ADMIN_TEMPLATE_ID, templateParams, PUBLIC_KEY);
      // await emailjs.send(SERVICE_ID, AUTO_REPLY_ID, templateParams, PUBLIC_KEY);

      Alert.alert("Success", "Message sent successfully! We will get back to you soon.");
      setFormData({ name: "", mobile: "", email: "", message: "" }); 

    } catch (error: any) {
      console.error("FAILED...", error);
      Alert.alert("Error", "Something went wrong. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Contact & Complaints</Text>
          <Text style={styles.pageSubtitle}>Reach out for queries, feedback, or grievance redressal.</Text>
        </View>

        {/* PROFILE SECTION */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <Text style={styles.greeting}>Hello, I Am</Text>
            <Text style={styles.namePrimary}>Jaiprakash Parthasarathy</Text>
            <Text style={styles.nameAlias}>(Also known as: Elvan Parthasarathy)</Text>
            
            <TouchableOpacity 
              style={styles.portfolioBtn}
              onPress={() => handlePressLink("https://jaiprakashpartha.vercel.app/")}
            >
              <Text style={styles.portfolioText}>Visit My Portfolio</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" style={{marginLeft: 5}} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Contact Info</Text>
          <View style={styles.contactList}>
            <TouchableOpacity style={styles.contactItem} onPress={() => handlePressLink("tel:+919345128797")}>
              <View style={styles.iconBox}><Ionicons name="call" size={18} color="#007AFF" /></View>
              <Text style={styles.contactText}>+91 93451 28797</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={() => handlePressLink("mailto:jaiprakashpartha@gmail.com")}>
              <View style={styles.iconBox}><Ionicons name="mail" size={18} color="#EA580C" /></View>
              <Text style={styles.contactText}>jaiprakashpartha@gmail.com</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={() => handlePressLink("https://linkedin.com/in/jaiprakashpartha")}>
              <View style={styles.iconBox}><Ionicons name="logo-linkedin" size={18} color="#0A66C2" /></View>
              <Text style={styles.contactText}>/in/jaiprakashpartha</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={() => handlePressLink("https://github.com/elvanparthasarathy")}>
              <View style={styles.iconBox}><Ionicons name="logo-github" size={18} color="#333" /></View>
              <Text style={styles.contactText}>/elvanparthasarathy</Text>
            </TouchableOpacity>

            <View style={styles.contactItem}>
              <View style={styles.iconBox}><Ionicons name="location" size={18} color="#DC2626" /></View>
              <View>
                <Text style={styles.contactText}>Arani, Tamil Nadu - 632317</Text>
                <Text style={styles.contactSubText}>(Currently in Chennai)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* FORM SECTION */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Send a Message</Text>
          <Text style={styles.formSubtitle}>Fill out the form below and it will reach me directly.</Text>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Your Name" 
                placeholderTextColor="#9CA3AF"
                value={formData.name}
                onChangeText={(val) => handleChange('name', val)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Mobile Number" 
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
                value={formData.mobile}
                onChangeText={(val) => handleChange('mobile', val)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Email Address" 
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(val) => handleChange('email', val)}
              />
            </View>

            <View style={[styles.inputGroup, { alignItems: 'flex-start' }]}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color="#9CA3AF" style={[styles.inputIcon, { marginTop: 12 }]} />
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Your Message / Review / Query" 
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
                value={formData.message}
                onChangeText={(val) => handleChange('message', val)}
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Send Message</Text>
                  <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { paddingBottom: 40 },
  
  header: { padding: 20, paddingTop: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', marginBottom: 15 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 5 },
  pageSubtitle: { fontSize: 13, color: '#6B7280' },

  card: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  
  // Profile
  profileHeader: { alignItems: 'center', marginBottom: 15 },
  greeting: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600', marginBottom: 5 },
  namePrimary: { fontSize: 22, fontWeight: '800', color: '#111827', textAlign: 'center' },
  nameAlias: { fontSize: 12, color: '#6B7280', marginTop: 2, fontStyle: 'italic' },
  portfolioBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 15 },
  portfolioText: { color: '#fff', fontWeight: '600', fontSize: 12 },

  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 20 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 15 },
  contactList: { gap: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
  iconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  contactText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  contactSubText: { fontSize: 12, color: '#9CA3AF' },

  // Form Section
  formSection: { paddingHorizontal: 16 },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 5 },
  formSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 15 },
  formCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  
  inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, marginBottom: 15, paddingHorizontal: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#111' },
  textArea: { height: 100, paddingTop: 14 },

  submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, marginTop: 5 },
  submitBtnDisabled: { backgroundColor: '#A7F3D0' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
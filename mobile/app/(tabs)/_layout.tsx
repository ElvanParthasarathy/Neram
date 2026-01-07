import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 1. Create the Swipeable Navigator
const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      
      {/* 2. CUSTOM HEADER (Because TopTabs removes the default header) */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Neram</Text>
        <TouchableOpacity 
          onPress={() => router.push('/menu')} 
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* 3. SWIPEABLE TABS CONFIGURATION */}
      <MaterialTopTabs
        tabBarPosition="bottom" // Force bar to bottom
        screenOptions={{
          swipeEnabled: true,   // ENABLE SWIPE
          animationEnabled: true,
          tabBarIndicatorStyle: { height: 0 }, // Hide the sliding line
          tabBarPressColor: 'transparent', // Remove ripple on Android
          tabBarShowIcon: true,
          tabBarLabelStyle: { fontSize: 10, textTransform: 'capitalize', fontWeight: '600', marginTop: -5 },
          tabBarIconStyle: { width: 24, height: 24 },
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 85 : 65,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
            borderTopWidth: 1,
            borderTopColor: '#E5E5EA',
            backgroundColor: '#fff', // Keep it white/clean
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#8E8E93',
        }}
      >
        
        {/* --- TABS --- */}
        <MaterialTopTabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
            ),
          }}
        />

        <MaterialTopTabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "time" : "time-outline"} size={24} color={color} />
            ),
          }}
        />

        <MaterialTopTabs.Screen
          name="calendar"
          options={{
            title: 'Calendar',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
            ),
          }}
        />

        <MaterialTopTabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            ),
          }}
        />

        {/* Hide 'explore' or other files */}
        <MaterialTopTabs.Screen
          name="explore"
          options={{
            tabBarItemStyle: { display: 'none' }, // Hide from bar
          }}
        />
      </MaterialTopTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#007AFF',
  },
  menuButton: {
    // Extra padding for touch target is handled by hitSlop
  }
});
import React from 'react';
// Navigation Configuration
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Screens
import HomeScreen from '../pages/HomeScreen';
import ScheduleScreen from '../pages/ScheduleScreen';
import CalendarScreen from '../pages/CalendarScreen';
import LoginScreen from '../pages/LoginScreen';
import SignupScreen from '../pages/SignupScreen';
import ProfileScreen from '../pages/ProfileScreen';
import CollegeSitesScreen from '../pages/CollegeSitesScreen';
import ContactScreen from '../pages/ContactScreen';
import SettingsScreen from '../pages/SettingsScreen';
import UserDirectoryScreen from '../pages/UserDirectoryScreen';

// Admin Screens
import AdminDashboardScreen from '../pages/admin/AdminDashboardScreen';
import AdminRoleManagerScreen from '../pages/admin/AdminRoleManagerScreen';
import AdminEventManagerScreen from '../pages/admin/AdminEventManagerScreen';
import AdminExamManagerScreen from '../pages/admin/AdminExamManagerScreen';
import AdminScheduleManagerScreen from '../pages/admin/AdminScheduleManagerScreen';

// Theme
import { useTheme } from '../context/ThemeContext';
import AppMenu from '../components/AppMenu';

import { createAppNavigatorStyles } from '../styles/NavigationStyles';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MyTabs() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const styles = React.useMemo(() => createAppNavigatorStyles(colors, insets), [colors, insets]);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: true, // Always show global header
                headerStyle: styles.headerStyle,
                headerTitleStyle: styles.headerTitleStyle,
                headerTitleAlign: 'left',
                headerRight: () => (
                    <View style={styles.headerRightContainer}>
                        <AppMenu />
                    </View>
                ),
                headerTitle: route.name,

                // === TAB BAR CONFIGURATION ===
                detachInactiveScreens: true, // Native optimization
                freezeOnBlur: false, // Keep false for persistent state
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    elevation: 8,
                    height: 60 + (Platform.OS === 'android' ? 0 : insets.bottom), // On Android, bottom-tabs handles insets if we don't fix height too restrictively, but with fixed height we need care. 
                    // Actually, for consistency across devices with "edge-to-edge" android:
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    paddingBottom: insets.bottom > 0 ? 0 : 4, // Adjust label position
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Schedule') iconName = focused ? 'time' : 'time-outline';
                    else if (route.name === 'Calendar') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person-circle' : 'person-circle-outline';

                    // Add subtle scale animation or just standard icon
                    return <Ionicons name={iconName} size={24} color={color} />;
                },

                // === PERFORMANCE ===
                // Keep false for "WhatsApp-like" instant switching (persistent views)

            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Schedule" component={ScheduleScreen} />
            <Tab.Screen name="Calendar" component={CalendarScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'fade_from_bottom', // Fast Android-style animation
                animationDuration: 200, // Faster transitions
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
    )
}

function MainStack({ user }) {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right', // Native Android style
                animationDuration: 200, // Faster transitions (default is ~350ms)
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
            }}
        >
            {user ? (
                <>
                    <Stack.Screen
                        name="MainTabs"
                        component={MyTabs}
                        options={{ animation: 'fade' }} // Instant for main tabs
                    />
                    <Stack.Screen name="CollegeSites" component={CollegeSitesScreen} />
                    <Stack.Screen name="Contact" component={ContactScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="UserDirectory" component={UserDirectoryScreen} />

                    {/* Admin Routes */}
                    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                    <Stack.Screen name="AdminRoleManager" component={AdminRoleManagerScreen} />
                    <Stack.Screen name="AdminEventManager" component={AdminEventManagerScreen} />
                    <Stack.Screen name="AdminExamManager" component={AdminExamManagerScreen} />
                    <Stack.Screen name="AdminScheduleManager" component={AdminScheduleManagerScreen} />
                </>
            ) : (
                <Stack.Screen name="Auth" component={AuthStack} />
            )}
        </Stack.Navigator>
    );
}

export default function AppNavigator({ user }) {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <MainStack user={user} />
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

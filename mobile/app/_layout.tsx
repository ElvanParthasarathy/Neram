import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useColorScheme, View, ActivityIndicator } from 'react-native';

// 1. Prevent the splash screen from auto-hiding
// This keeps the native logo visible while we check if the user is logged in.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 2. Wait until Auth loading is finished
    if (loading) return;

    // 3. Hide the splash screen now that we know the login state
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      // If not logged in and trying to access tabs, go to login
      router.replace('/login');
    } else if (user && segments[0] === 'login') {
      // If logged in and on login page, go to home
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  // 4. Render a loading spinner while we wait (Safety fallback)
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Main Tabs (Home, Schedule, etc.) */}
        <Stack.Screen name="(tabs)" />

        {/* Login Screen */}
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />

        {/* The 3-Dot Menu (Opens as a Modal) */}
        <Stack.Screen
          name="menu"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom'
          }}
        />

        {/* --- Sub-Pages linked from the Menu --- */}
        <Stack.Screen
          name="college-sites"
          options={{
            presentation: 'card',
            title: 'College Sites',
            headerShown: true,
            headerBackTitle: 'Back'
          }}
        />

        <Stack.Screen
          name="contact"
          options={{
            presentation: 'card',
            title: 'Contact Support',
            headerShown: true,
            headerBackTitle: 'Back'
          }}
        />

        <Stack.Screen
          name="admin"
          options={{
            presentation: 'card',
            title: 'Admin Panel',
            headerShown: true,
            headerBackTitle: 'Back'
          }}
        />

        {/* Generic Modal (Optional) */}
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

// Wrap the entire navigation structure in the AuthProvider
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
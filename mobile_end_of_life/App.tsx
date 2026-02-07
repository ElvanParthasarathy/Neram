import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { GlobalProvider, useGlobal } from './src/context/GlobalContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

function AppContent() {
  const { user, authResolved } = useGlobal();
  const { colors } = useTheme();

  // Wait for auth to resolve before showing anything
  // This prevents login screen flash when user is actually logged in
  if (!authResolved) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return <AppNavigator user={user} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <GlobalProvider>
        <AppContent />
      </GlobalProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

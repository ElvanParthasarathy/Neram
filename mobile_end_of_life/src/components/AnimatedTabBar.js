import React, { useEffect, useState, memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Memoized Tab Item Component - prevents re-render unless props change
const TabItem = memo(({
    label,
    isFocused,
    onPress,
    activeColor,
    inactiveColor
}) => {
    const [pressed, setPressed] = useState(false);

    // Determine icon name
    let iconName = 'ellipse';
    if (label === 'Home') iconName = isFocused ? 'home' : 'home-outline';
    if (label === 'Schedule') iconName = isFocused ? 'time' : 'time-outline';
    if (label === 'Calendar') iconName = isFocused ? 'calendar' : 'calendar-outline';
    if (label === 'Profile') iconName = isFocused ? 'person-circle' : 'person-circle-outline';

    const handlePressIn = useCallback(() => setPressed(true), []);
    const handlePressOut = useCallback(() => setPressed(false), []);

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={styles.tabItem}
        >
            <View style={[
                styles.tabContent,
                pressed && { transform: [{ scale: 0.9 }], opacity: 0.8 },
                isFocused && { transform: [{ scale: 1.1 }] }
            ]}>
                <Ionicons
                    name={iconName}
                    size={24}
                    color={isFocused ? activeColor : inactiveColor}
                />
                <Text style={[
                    styles.label,
                    { color: isFocused ? activeColor : inactiveColor, fontWeight: isFocused ? '600' : '400' }
                ]}>
                    {label}
                </Text>
            </View>
        </Pressable>
    );
});

export default function AnimatedTabBar({ state, descriptors, navigation }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [visible, setVisible] = useState(true);


    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setVisible(false));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setVisible(true));
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    if (!visible) return null;

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                paddingTop: 8,
                shadowColor: colors.shadow,
            }
        ]}>
            <View style={styles.tabsRow}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TabItem
                            key={route.key}
                            label={label}
                            isFocused={isFocused}
                            onPress={onPress}
                            activeColor={colors.accent}
                            inactiveColor={colors.textSecondary}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        elevation: 10,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderTopWidth: 1,
    },
    tabsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 10,
        marginTop: 4,
    }
});

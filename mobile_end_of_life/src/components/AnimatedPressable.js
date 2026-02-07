import React, { useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';

/**
 * AnimatedPressable - Instant touch feedback without native dependencies
 * 
 * Uses React Native's Pressable with immediate visual feedback via
 * onPressIn/onPressOut state changes.
 * 
 * @param {Function} onPress - Function to call on press
 * @param {Object} style - Style object  
 * @param {React.Node} children - Child components
 * @param {number} activeScale - Scale to animate to when pressed (simulated via opacity)
 * @param {number} activeOpacity - Opacity when pressed (default: 0.7)
 */
export default function AnimatedPressable({
    children,
    onPress,
    style,
    activeScale = 0.96, // Not used in this simpler version
    activeOpacity = 0.7,
    disabled = false,
    ...props
}) {
    const [pressed, setPressed] = useState(false);

    return (
        <Pressable
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            onPress={onPress}
            disabled={disabled}
            {...props}
        >
            <View style={[
                style,
                pressed && { opacity: activeOpacity, transform: [{ scale: activeScale }] }
            ]}>
                {children}
            </View>
        </Pressable>
    );
}

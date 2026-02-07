/**
 * ResponsivePressable - A highly optimized touchable component
 * Uses react-native-gesture-handler for instant iOS-like touch response
 */
import React from 'react';
import { Pressable as RNPressable, Platform } from 'react-native';
import { TouchableOpacity as GestureHandlerTouchableOpacity } from 'react-native-gesture-handler';

// For Android, use gesture-handler's TouchableOpacity for native performance
// For iOS, use Pressable which is already native-optimized
const BaseTouchable = Platform.OS === 'android'
    ? GestureHandlerTouchableOpacity
    : RNPressable;

export const ResponsivePressable = ({
    children,
    onPress,
    style,
    activeOpacity = 0.7,
    disabled,
    ...props
}) => {
    if (Platform.OS === 'android') {
        return (
            <BaseTouchable
                onPress={onPress}
                style={style}
                activeOpacity={activeOpacity}
                disabled={disabled}
                {...props}
            >
                {children}
            </BaseTouchable>
        );
    }

    // iOS - Use Pressable with instant feedback
    return (
        <RNPressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [
                style,
                pressed && { opacity: activeOpacity }
            ]}
            // Remove default delays for instant response
            delayLongPress={500}
            unstable_pressDelay={0}
            {...props}
        >
            {children}
        </RNPressable>
    );
};

// Default export for convenience
export default ResponsivePressable;

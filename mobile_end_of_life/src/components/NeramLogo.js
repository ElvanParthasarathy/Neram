import React from 'react';
import { View, StyleSheet } from 'react-native';
import NeramSvg from '../assets/neram.svg';

/**
 * Neram Logo component - renders the SVG logo with proper background
 * The SVG is black on transparent, so we add a white/light background
 */
const NeramLogo = ({ size = 80, style }) => {
    return (
        <View style={[styles.container, { width: size, height: size }, style]}>
            <NeramSvg width={size * 0.8} height={size * 0.8} fill="#0F172A" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default NeramLogo;

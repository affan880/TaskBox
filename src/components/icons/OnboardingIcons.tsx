import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: any;
};

// This component provides reliable icon rendering across platforms
export function OnboardingIcon({ name, size = 50, color = '#fff', style }: IconProps) {
  // Always use text-based fallbacks on iOS to avoid nil object crashes
  const getIconFallback = () => {
    switch (name) {
      case 'inbox-multiple':
        return '📥';
      case 'check-circle-outline':
        return '✓';
      case 'email-outline':
        return '✉️';
      default:
        return '•';
    }
  };
  
  // On iOS, always use emoji fallbacks
  return (
    <View style={[styles.container, style]}>
      {Platform.OS !== 'ios' ? (
        <Icon name={name} size={size} color={color} />
      ) : (
        <Text style={[styles.fallbackText, { fontSize: size * 0.8, color }]}>
          {getIconFallback()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    textAlign: 'center',
  }
}); 
import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type IconProps = {
  size?: number;
  color?: string;
  style?: any;
};

export function Clock({ size = 24, color = '#000', style }: IconProps) {
  return <MaterialCommunityIcons name="clock-outline" size={size} color={color} style={style} />;
}

export function Calendar({ size = 24, color = '#000', style }: IconProps) {
  return <MaterialCommunityIcons name="calendar" size={size} color={color} style={style} />;
}

export function Sun({ size = 24, color = '#000', style }: IconProps) {
  return <MaterialCommunityIcons name="white-balance-sunny" size={size} color={color} style={style} />;
}

export function Moon({ size = 24, color = '#000', style }: IconProps) {
  return <MaterialCommunityIcons name="moon-waning-crescent" size={size} color={color} style={style} />;
} 
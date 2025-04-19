import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type IconProps = {
  name: string;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 24, color = '#000' }: IconProps) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
} 
import * as React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type EmailButtonProps = {
  onPress: () => void;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  iconColor?: string;
  iconSize?: number;
};

export function EmailButton({
  onPress,
  label,
  icon,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  labelStyle,
  iconColor,
  iconSize = 20,
}: EmailButtonProps): React.ReactElement {
  const { colors, isDark } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled ? colors.brand.primary + '80' : colors.brand.primary,
          },
          label: {
            color: colors.text.inverse,
          },
          icon: colors.text.inverse,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: disabled ? colors.background.secondary + '80' : colors.background.secondary,
          },
          label: {
            color: colors.text.primary,
          },
          icon: colors.text.primary,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: disabled ? colors.border.light + '80' : colors.border.light,
          },
          label: {
            color: disabled ? colors.text.tertiary : colors.text.primary,
          },
          icon: disabled ? colors.text.tertiary : colors.text.primary,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          label: {
            color: disabled ? colors.text.tertiary : colors.text.primary,
          },
          icon: disabled ? colors.text.tertiary : colors.text.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 6,
          },
          label: {
            fontSize: 12,
          },
          icon: 16,
        };
      case 'medium':
        return {
          container: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
          },
          label: {
            fontSize: 14,
          },
          icon: 20,
        };
      case 'large':
        return {
          container: {
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 10,
          },
          label: {
            fontSize: 16,
          },
          icon: 24,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...variantStyles.container,
      ...sizeStyles.container,
      ...(fullWidth && { width: '100%' }),
      ...style,
    },
    label: {
      fontWeight: '500',
      ...variantStyles.label,
      ...sizeStyles.label,
      ...labelStyle,
    },
    iconContainer: {
      marginRight: 8,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {icon && !loading && (
        <View style={styles.iconContainer}>
          <Icon
            name={icon}
            size={iconSize || sizeStyles.icon}
            color={iconColor || variantStyles.icon}
          />
        </View>
      )}
      {loading ? (
        <Icon
          name="loader"
          size={sizeStyles.icon}
          color={variantStyles.icon}
          style={{ opacity: 0.7 }}
        />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </TouchableOpacity>
  );
} 
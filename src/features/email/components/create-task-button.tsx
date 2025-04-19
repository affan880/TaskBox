import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'src/theme/theme-context';
import { SPACING, TYPOGRAPHY } from '../../../theme/theme';

type CreateTaskButtonProps = {
  onPress: () => void;
  isLoading?: boolean;
};

export function CreateTaskButton({ onPress, isLoading }: CreateTaskButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.brand?.primary,
          opacity: isLoading ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      <View style={styles.content}>
        <Icon name="auto-awesome" size={24} color={colors.text?.inverse} />
        <Text style={[styles.text, { color: colors.text?.inverse }]}>
          {isLoading ? 'Creating Task...' : 'Create Task'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
  },
}); 
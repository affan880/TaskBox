import * as React from 'react';
import { TouchableOpacity, Animated, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SHADOWS, BORDER_RADIUS, SPACING } from 'src/theme/theme';

type ComposeButtonProps = {
  composeTranslateY: Animated.AnimatedInterpolation<string | number>;
  onPress: () => void;
  colors: any;
};

export const ComposeButton = React.memo(({ composeTranslateY, onPress, colors }: ComposeButtonProps) => {
  return (
    <Animated.View
      style={[
        styles.fabContainer,
        {
          transform: [{ translateY: composeTranslateY }],
          bottom: Platform.OS === 'ios' ? 20 : 16,
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.brand.primary }]}
        onPress={onPress}
        accessibilityLabel="Compose new email"
        accessibilityHint="Double tap to compose a new email"
      >
        <Icon name="edit" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: SPACING.md,
    ...SHADOWS.lg,
    zIndex: 10, // Ensure FAB is above content
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.round / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
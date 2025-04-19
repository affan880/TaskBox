import * as React from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  View 
} from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from 'src/theme/theme-context';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ComposeButtonProps = {
  composeTranslateY: Animated.SharedValue<number>;
  onPress: () => void;
};

export function ComposeButton({ 
  composeTranslateY, 
  onPress 
}: ComposeButtonProps) {
  const { colors } = useTheme();

  const animatedStyle = {
    transform: [
      { translateY: composeTranslateY }
    ]
  };

  return (
    <AnimatedTouchable
      style={[
        styles.container,
        {
          backgroundColor: colors.brand?.primary ?? '#6366f1',
        },
        animatedStyle
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.innerContainer}>
        <Icon name="edit" size={24} color="#fff" />
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  innerContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  }
});

ComposeButton.displayName = 'ComposeButton'; 
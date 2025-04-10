import * as React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Text,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../../theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ThemeToggleProps = {
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md' | 'lg';
  withLabel?: boolean;
};

export function ThemeToggle({ style, size = 'md', withLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme, colors } = useTheme();
  
  // Animated values for toggle transitions
  const translateX = React.useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const rotateValue = React.useRef(new Animated.Value(isDark ? 1 : 0)).current;
  
  // Update animation when theme changes
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isDark ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(rotateValue, {
        toValue: isDark ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDark, translateX, rotateValue]);
  
  // Calculate sizes based on prop
  const getSize = () => {
    switch (size) {
      case 'sm':
        return {
          width: 44,
          height: 24,
          thumbSize: 18,
          iconSize: 14,
          padding: 3,
        };
      case 'lg':
        return {
          width: 72,
          height: 36,
          thumbSize: 28,
          iconSize: 20,
          padding: 4,
        };
      case 'md':
      default:
        return {
          width: 56,
          height: 30,
          thumbSize: 22,
          iconSize: 16,
          padding: 4,
        };
    }
  };
  
  const { width, height, thumbSize, iconSize, padding } = getSize();
  
  // Translate the thumb based on toggle state
  const thumbTranslateX = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [padding, width - thumbSize - padding],
  });
  
  // Rotate the sun/moon icons
  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Colors for toggle
  const trackColor = isDark ? colors.surface.interactive : colors.background.accent;
  const thumbColor = isDark ? colors.brand.dark : colors.brand.primary;
  
  return (
    <View style={[styles.container, style]}>
      {withLabel && (
        <Text style={[styles.label, { color: colors.text.secondary }]}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Text>
      )}
      
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={toggleTheme}
        style={[
          styles.track,
          {
            backgroundColor: trackColor,
            width,
            height,
            borderRadius: height / 2,
          },
        ]}
        accessibilityRole="switch"
        accessibilityState={{ checked: isDark }}
        accessibilityLabel={`Toggle ${isDark ? 'light' : 'dark'} theme`}
        accessibilityHint={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: thumbColor,
              transform: [
                { translateX: thumbTranslateX },
                { rotate },
              ],
            },
          ]}
        >
          <Icon
            name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
            size={iconSize}
            color={isDark ? '#FFFFFF' : '#FFFFFF'}
            style={styles.icon}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    justifyContent: 'center',
  },
  thumb: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  icon: {
    alignSelf: 'center',
  },
  label: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
  },
}); 
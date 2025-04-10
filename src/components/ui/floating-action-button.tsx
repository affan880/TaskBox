import * as React from 'react';
import {
  TouchableOpacity,
  View,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
  Text,
} from 'react-native';
import { useTheme } from '../../theme/theme-context';
import * as Animatable from 'react-native-animatable';

type Props = {
  icon: React.ReactNode;
  onPress: () => void;
  position?: 'bottomRight' | 'bottomLeft' | 'bottomCenter';
  style?: StyleProp<ViewStyle>;
  color?: string;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  expanded?: boolean;
  mini?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function FloatingActionButton({
  icon,
  onPress,
  position = 'bottomRight',
  style,
  color,
  label,
  labelStyle,
  expanded = false,
  mini = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const { colors, isDark } = useTheme();
  const scale = React.useRef(new Animated.Value(1)).current;
  const labelOpacity = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const buttonRef = React.useRef<Animatable.View & View>(null);
  
  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      speed: 20,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 20,
      useNativeDriver: true,
    }).start();
  };
  
  // Handle label visibility
  React.useEffect(() => {
    Animated.timing(labelOpacity, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded, labelOpacity]);
  
  // Decide position style
  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'bottomLeft':
        return styles.bottomLeft;
      case 'bottomCenter':
        return styles.bottomCenter;
      case 'bottomRight':
      default:
        return styles.bottomRight;
    }
  };
  
  // Decide size style
  const getSizeStyle = (): ViewStyle => {
    return mini ? styles.mini : styles.standard;
  };
  
  // Entry animation
  React.useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.animate({
        0: { scaleX: 0, scaleY: 0, opacity: 0 },
        1: { scaleX: 1, scaleY: 1, opacity: 1 }
      }, 300);
    }
  }, []);
  
  // Colors
  const backgroundColor = color || colors.brand.primary;
  const rippleColor = isDark ? 'rgba(255, 255, 255, 0.32)' : 'rgba(0, 0, 0, 0.32)';
  
  return (
    <Animatable.View 
      ref={buttonRef}
      style={[styles.container, getPositionStyle(), style]}
    >
      {label && expanded && (
        <Animated.View 
          style={[
            styles.labelContainer,
            {
              opacity: labelOpacity,
              transform: [
                {
                  translateY: labelOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.label,
              {
                backgroundColor: isDark ? colors.surface.primary : colors.surface.elevated,
              },
            ]}
          >
            <Text
              style={[
                styles.labelText,
                { color: colors.text.primary },
                labelStyle,
              ]}
            >
              {label}
            </Text>
          </View>
        </Animated.View>
      )}
      
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            getSizeStyle(),
            {
              backgroundColor,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
        >
          {icon}
        </TouchableOpacity>
      </Animated.View>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
  },
  bottomRight: {
    bottom: 16,
    right: 16,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
  },
  bottomCenter: {
    bottom: 16,
    alignSelf: 'center',
  },
  buttonWrapper: {
    // For shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 28,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  standard: {
    width: 56,
    height: 56,
  },
  mini: {
    width: 40,
    height: 40,
  },
  labelContainer: {
    position: 'absolute',
    bottom: 65,
    borderRadius: 4,
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 
import * as React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  AccessibilityInfo,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastProps = {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
  position?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
};

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  position = 'bottom',
  style,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const animation = React.useRef(new Animated.Value(0)).current;
  const [screenReaderEnabled, setScreenReaderEnabled] = React.useState(false);
  const [animationValue, setAnimationValue] = React.useState(0);
  
  // Track animation value changes
  React.useEffect(() => {
    const id = animation.addListener(({ value }) => {
      setAnimationValue(value);
    });
    
    return () => {
      animation.removeListener(id);
    };
  }, [animation]);
  
  React.useEffect(() => {
    // Check if screen reader is enabled
    const checkScreenReader = async () => {
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setScreenReaderEnabled(isEnabled);
    };
    
    checkScreenReader();
    
    // Set up screen reader change listener
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled
    );
    
    return () => {
      subscription.remove();
    };
  }, []);

  React.useEffect(() => {
    let hideTimeout: NodeJS.Timeout;
    
    if (visible) {
      // If screen reader is enabled, don't auto-dismiss
      const autoDismissDuration = screenReaderEnabled ? 10000 : duration;
      
      // Animate in
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Schedule hide
      hideTimeout = setTimeout(() => {
        handleDismiss();
      }, autoDismissDuration);
    }
    
    return () => {
      if (hideTimeout) clearTimeout(hideTimeout);
    };
  }, [visible, duration, screenReaderEnabled]);
  
  // Handle dismiss with animation
  const handleDismiss = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };
  
  // If not visible and animation is at 0, don't render
  if (!visible && animationValue === 0) return null;

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Icon name="check-circle" size={24} color="#fff" />;
      case 'error':
        return <Icon name="alert-circle" size={24} color="#fff" />;
      case 'warning':
        return <Icon name="alert" size={24} color="#fff" />;
      default:
        return <Icon name="information" size={24} color="#fff" />;
    }
  };
  
  // Get background color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return COLORS.status.success;
      case 'error':
        return COLORS.status.error;
      case 'warning':
        return COLORS.status.warning;
      default:
        return COLORS.status.info;
    }
  };
  
  // Animation transforms based on position
  const getAnimatedStyle = () => {
    if (position === 'top') {
      return {
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [-100, 0],
            }),
          },
        ],
      };
    }
    return {
      opacity: animation,
      transform: [
        {
          translateY: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
          }),
        },
      ],
    };
  };

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' 
          ? { top: insets.top + 10 } 
          : { bottom: insets.bottom + 10 },
        { backgroundColor: getBackgroundColor() },
        getAnimatedStyle(),
        style,
      ]}
      accessibilityRole="alert"
      accessibilityLabel={`${type} message: ${message}`}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
      
      <TouchableOpacity
        onPress={handleDismiss}
        style={styles.closeButton}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        accessibilityHint="Dismisses the current notification"
      >
        <Icon name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
});

// Create a singleton toast manager
type ToastConfig = {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'bottom';
};

class ToastManager {
  private static instance: ToastManager;
  private callback: ((config: ToastConfig & { visible: boolean }) => void) | null = null;
  
  private constructor() {}
  
  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }
  
  public setCallback(callback: (config: ToastConfig & { visible: boolean }) => void): void {
    this.callback = callback;
  }
  
  public show(config: ToastConfig): void {
    if (this.callback) {
      this.callback({ ...config, visible: true });
    }
  }
  
  public hide(): void {
    if (this.callback) {
      this.callback({ message: '', visible: false });
    }
  }
}

export const toast = ToastManager.getInstance();

// Toast Provider Component
type ToastProviderProps = {
  children: React.ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toastConfig, setToastConfig] = React.useState<ToastConfig & { visible: boolean }>({
    visible: false,
    message: '',
  });
  
  React.useEffect(() => {
    toast.setCallback(setToastConfig);
    return () => {
      toast.setCallback(() => {});
    };
  }, []);

  return (
    <>
      {children}
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        duration={toastConfig.duration}
        position={toastConfig.position}
        onDismiss={() => setToastConfig({ ...toastConfig, visible: false })}
      />
    </>
  );
} 
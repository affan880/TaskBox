import * as React from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  StatusBar,
  ScrollView,
  ViewStyle,
  ScrollViewProps,
  StyleProp,
  Dimensions,
  AccessibilityInfo,
  Keyboard,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';

type Props = {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  scrollViewProps?: ScrollViewProps;
  statusBarStyle?: "light-content" | "dark-content" | "default";
  backgroundColor?: string;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
  accessibilityLabel?: string;
};

export function Screen({ 
  children, 
  scrollable = true,
  style,
  scrollViewProps,
  statusBarStyle = "dark-content",
  backgroundColor = COLORS.background.primary,
  keyboardShouldPersistTaps = "handled",
  accessibilityLabel,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  
  // Keyboard handling
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const [screenReaderEnabled, setScreenReaderEnabled] = React.useState(false);
  
  // Check if screen reader is enabled
  React.useEffect(() => {
    const checkScreenReader = async () => {
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setScreenReaderEnabled(isEnabled);
    };
    
    checkScreenReader();
    
    // Listen for screen reader changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled
    );
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  // Keyboard listeners
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  
  const Content = scrollable ? ScrollView : View;

  return (
    <View 
      style={[styles.container, { backgroundColor }]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="none"
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        style={[styles.keyboardView]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Content
          {...scrollViewProps}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          contentInsetAdjustmentBehavior="automatic"
          accessibilityViewIsModal={screenReaderEnabled}
          style={[
            styles.content,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom + (keyboardVisible ? 0 : 16),
              paddingLeft: insets.left + 16,
              paddingRight: insets.right + 16,
            },
            isPortrait ? styles.portraitPadding : styles.landscapePadding,
            style,
          ]}
        >
          {children}
        </Content>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  portraitPadding: {
    paddingHorizontal: 16,
  },
  landscapePadding: {
    paddingHorizontal: 32,
  },
}); 
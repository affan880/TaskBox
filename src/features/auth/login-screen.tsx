import * as React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar, 
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useAuthStore } from '@/store/slices/auth-slice';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '@/navigation/types';
import { THEME } from '@/theme/theme';
import { DARK_COLORS, createTheme } from '@/theme/colors';

// Use dark theme as default
const theme = createTheme(true);

const { width, height } = Dimensions.get('window');

// Google sign-in button colors
const GOOGLE_BLUE = '#4285F4';
const GOOGLE_WHITE = '#FFFFFF';

export function LoginScreen() {
  const { signInWithGoogle, hasAcceptedTerms, isLoading, error } = useAuthStore();
  const navigation = useNavigation<AuthNavigationProp>();

  // Animation values
  const logoAnimation = React.useRef(new Animated.Value(0)).current;
  const buttonAnimation = React.useRef(new Animated.Value(0)).current;
  const errorAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Animate elements in sequence
    Animated.stagger(THEME.animation.duration.slow, [
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: THEME.animation.duration.slowest,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: THEME.animation.duration.slowest,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate error if it exists
    if (error) {
      Animated.timing(errorAnimation, {
        toValue: 1,
        duration: THEME.animation.duration.slow,
        useNativeDriver: true,
      }).start();
    } else {
      errorAnimation.setValue(0);
    }
  }, [error]);

  // Common animation styles
  const logoStyle = {
    opacity: logoAnimation,
    transform: [
      {
        translateY: logoAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [-THEME.spacing.xxxxl, 0],
        }),
      },
    ],
  };

  const buttonStyle = {
    opacity: buttonAnimation,
    transform: [
      {
        translateY: buttonAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [THEME.spacing.xxxl, 0],
        }),
      },
    ],
  };

  const errorStyle = {
    opacity: errorAnimation,
    transform: [
      {
        translateY: errorAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [THEME.spacing.lg, 0],
        }),
      },
    ],
  };

  // Loading animation for button
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: THEME.animation.duration.slowest,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: THEME.animation.duration.slowest,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: THEME.animation.duration.slow,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  const handleSignIn = async () => {
    if (!hasAcceptedTerms) {
      navigation.navigate('Terms');
      return;
    }
    await signInWithGoogle();
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={[theme.background.primary, theme.background.secondary]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Decorative elements */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />
      <View style={[styles.circle, styles.circle4]} />
      
      <SafeAreaView style={styles.content}>
        {/* App Logo and Title */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <View style={styles.logoCircle}>
            <Image 
              source={require('../../../assets/images/Icon-Only-White.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          <Text style={styles.logoText}>Plexar</Text>
          <Text style={styles.logoTagline}>Organize your life, one task at a time</Text>
        </Animated.View>
        
        {/* Error Message */}
        {error && (
          <Animated.View style={[styles.errorContainer, errorStyle]}>
            <Icon name="alert-circle" size={THEME.layout.iconSize.md} color={theme.text.inverse} style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}
        
        {/* Sign In Button */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={[styles.googleButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={THEME.opacity.high}
            >
              <View style={styles.buttonContent}>
                {/* Google logo */}
                <View style={styles.googleIconContainer}>
                  <Image 
                    source={require('../../../assets/images/google-icon.png')}
                    style={styles.googleIcon} 
                    resizeMode="contain"
                  />
                </View>
                
                <Text style={styles.buttonText}>
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          <Text style={styles.privacyText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.xxl,
    justifyContent: 'space-between',
  },
  // Decorative elements
  circle: {
    position: 'absolute',
    borderRadius: THEME.borderRadius.round,
    backgroundColor: theme.surface.glass,
    borderWidth: 1,
    borderColor: theme.border.glass,
  },
  circle1: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.5,
    left: -width * 0.3,
  },
  circle2: {
    width: width * 0.8,
    height: width * 0.8,
    bottom: -width * 0.4,
    right: -width * 0.4,
  },
  circle3: {
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.3,
    left: -width * 0.25,
  },
  circle4: {
    width: width * 0.3,
    height: width * 0.3,
    top: height * 0.15,
    right: width * 0.1,
  },
  // Logo section
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.12,
  },
  logoCircle: {
    width: THEME.layout.avatarSize.xxl + THEME.spacing.xxxl,
    height: THEME.layout.avatarSize.xxl + THEME.spacing.xxxl,
    borderRadius: THEME.borderRadius.round,
    backgroundColor: theme.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.xxl,
    ...THEME.shadows.floating,
    borderWidth: 1,
    borderColor: theme.border.glass,
  },
  logo: {
    width: THEME.layout.iconSize.xxl + THEME.spacing.xxl,
    height: THEME.layout.iconSize.xxl + THEME.spacing.xxl,
  },
  logoText: {
    fontSize: THEME.typography.variant.h1.fontSize,
    fontWeight: THEME.typography.variant.h1.fontWeight,
    color: theme.text.primary,
    textAlign: 'center',
    marginBottom: THEME.spacing.md,
    letterSpacing: THEME.typography.variant.h1.letterSpacing,
  },
  logoTagline: {
    color: theme.text.secondary,
    fontSize: THEME.typography.variant.body1.fontSize,
    textAlign: 'center',
    maxWidth: width * 0.7,
    lineHeight: THEME.typography.lineHeight.relaxed * THEME.typography.variant.body1.fontSize,
  },
  // Error display
  errorContainer: {
    backgroundColor: theme.status.errorLight,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginVertical: THEME.spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: theme.status.error,
    ...THEME.shadows.sm,
  },
  errorIcon: {
    marginRight: THEME.spacing.sm,
  },
  errorText: {
    color: theme.text.primary,
    fontSize: THEME.typography.variant.body2.fontSize,
    flex: 1,
    lineHeight: THEME.typography.lineHeight.relaxed * THEME.typography.variant.body2.fontSize,
  },
  // Button section
  buttonContainer: {
    marginBottom: height * 0.1,
    alignItems: 'center',
  },
  googleButton: {
    width: width * 0.85,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    ...THEME.shadows.lg,
    marginBottom: THEME.spacing.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? THEME.spacing.lg : THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  buttonDisabled: {
    opacity: THEME.opacity.disabled,
  },
  googleIconContainer: {
    width: THEME.layout.iconSize.lg,
    height: THEME.layout.iconSize.lg,
    marginRight: THEME.spacing.xxl,
    marginLeft: THEME.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    width: THEME.layout.iconSize.lg,
    height: THEME.layout.iconSize.lg,
  },
  buttonText: {
    color: 'rgba(0, 0, 0, 0.87)',
    fontSize: THEME.typography.variant.button.fontSize,
    fontWeight: THEME.typography.variant.button.fontWeight,
    letterSpacing: THEME.typography.variant.button.letterSpacing,
    fontFamily: Platform.OS === 'ios' ? THEME.typography.fontFamily.base : 'Roboto',
    textAlign: 'left',
    flex: 1,
  },
  privacyText: {
    color: theme.text.tertiary,
    fontSize: THEME.typography.variant.caption.fontSize,
    textAlign: 'center',
    maxWidth: width * 0.8,
    lineHeight: THEME.typography.lineHeight.normal * THEME.typography.variant.caption.fontSize,
  },
}); 
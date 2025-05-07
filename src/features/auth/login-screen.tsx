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

const { width, height } = Dimensions.get('window');

// Google sign-in button colors
const GOOGLE_BLUE = '#4285F4';
const GOOGLE_WHITE = '#FFFFFF';

export function LoginScreen() {
  const signInWithGoogle = useAuthStore(state => state.signInWithGoogle);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);

  // Animation values
  const logoAnimation = React.useRef(new Animated.Value(0)).current;
  const buttonAnimation = React.useRef(new Animated.Value(0)).current;
  const errorAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Animate elements in sequence
    Animated.stagger(300, [
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate error if it exists
    if (error) {
      Animated.timing(errorAnimation, {
        toValue: 1,
        duration: 300,
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
          outputRange: [-50, 0],
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
          outputRange: [40, 0],
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
          outputRange: [20, 0],
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
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['#121212', '#2A2A2A']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
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
          <Text style={styles.logoText}>TaskBox</Text>
          <Text style={styles.logoTagline}>Organize your life, one task at a time</Text>
        </Animated.View>
        
        {/* Error Message */}
        {error && (
          <Animated.View style={[styles.errorContainer, errorStyle]}>
            <Icon name="alert-circle" size={20} color="#fff" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}
        
        {/* Sign In Button */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={[styles.googleButton, isLoading && styles.buttonDisabled]}
              onPress={signInWithGoogle}
              disabled={isLoading}
              activeOpacity={0.9}
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
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  // Decorative elements
  circle: {
    position: 'absolute',
    borderRadius: 500,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logo: {
    width: 70,
    height: 70,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  logoTagline: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: width * 0.7,
  },
  // Error display
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  // Button section
  buttonContainer: {
    marginBottom: height * 0.1,
    alignItems: 'center',
  },
  googleButton: {
    width: width * 0.85,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    marginRight: 24,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  buttonText: {
    color: 'rgba(0, 0, 0, 0.87)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.25,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    textAlign: 'left',
    flex: 1,
  },
  privacyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: width * 0.8,
    lineHeight: 18,
  },
}); 
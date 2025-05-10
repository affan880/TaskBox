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
          <Text style={styles.logoText}>Plexar</Text>
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
              onPress={handleSignIn}
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
    backgroundColor: '#0066ff', // Using primary blue as base
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  // Decorative elements with neo-brutalist theme
  circle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#000000',
    transform: [{ rotate: '5deg' }],
  },
  circle1: {
    width: width * 1.2,
    height: width * 0.4,
    top: -width * 0.2,
    left: -width * 0.3,
    backgroundColor: '#ff3333',
  },
  circle2: {
    width: width * 0.8,
    height: width * 0.3,
    bottom: -width * 0.15,
    right: -width * 0.4,
    backgroundColor: '#ffde59',
    transform: [{ rotate: '-5deg' }],
  },
  circle3: {
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.3,
    left: -width * 0.25,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '15deg' }],
  },
  circle4: {
    width: width * 0.3,
    height: width * 0.3,
    top: height * 0.15,
    right: width * 0.1,
    backgroundColor: '#ff3333',
    transform: [{ rotate: '-10deg' }],
  },
  // Logo section with neo-brutalist theme
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.12,
    transform: [{ rotate: '-2deg' }],
  },
  logoCircle: {
    width: 140,
    height: 140,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
    transform: [{ rotate: '3deg' }],
  },
  logo: {
    width: 80,
    height: 80,
    transform: [{ rotate: '-3deg' }],
  },
  logoText: {
    fontSize: 72,
    fontFamily: 'Montserrat-Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    backgroundColor: '#ff3333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  logoTagline: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    maxWidth: width * 0.8,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.5,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    transform: [{ rotate: '1deg' }],
  },
  // Error display with neo-brutalist theme
  errorContainer: {
    backgroundColor: '#ff3333',
    padding: 20,
    marginVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    transform: [{ rotate: '-1deg' }],
  },
  errorIcon: {
    marginRight: 12,
    transform: [{ scale: 1.2 }],
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Button section with neo-brutalist theme
  buttonContainer: {
    marginBottom: height * 0.1,
    alignItems: 'center',
    transform: [{ rotate: '1deg' }],
  },
  googleButton: {
    width: width * 0.85,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: 20,
    transform: [{ rotate: '-1deg' }],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 20 : 18,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  googleIconContainer: {
    width: 28,
    height: 28,
    marginRight: 24,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    transform: [{ rotate: '5deg' }],
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'left',
    flex: 1,
  },
  privacyText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: width * 0.8,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    marginTop: 24,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    transform: [{ rotate: '-1deg' }],
  },
}); 
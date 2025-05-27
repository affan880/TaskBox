import * as React from 'react';
import { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  Animated, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  StatusBar,
  Image,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/auth-navigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingIcon } from '../../components/icons/OnboardingIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';

type OnboardingNavigationProp = StackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Plexar',
    description: 'Organize your tasks, emails, and schedule all in one beautiful place',
    image: require('../../../assets/images/blob1.png'),
    gradientColors: ['#667eea', '#764ba2', '#f093fb'],
    darkGradientColors: ['#1a1a2e', '#16213e', '#0f3460'],
    icon: 'inbox-multiple',
  },
  {
    id: '2',
    title: 'Stay Organized',
    description: 'Create to-do lists, set reminders, and never miss a deadline again',
    image: require('../../../assets/images/blob2.png'),
    gradientColors: ['#764ba2', '#f093fb', '#667eea'],
    darkGradientColors: ['#16213e', '#0f3460', '#1a1a2e'],
    icon: 'check-circle-outline',
  },
  {
    id: '3',
    title: 'Manage Your Emails',
    description: 'Connect your Gmail account to manage emails without leaving the app',
    image: require('../../../assets/images/blob1.png'),
    gradientColors: ['#f093fb', '#667eea', '#764ba2'],
    darkGradientColors: ['#0f3460', '#1a1a2e', '#16213e'],
    icon: 'email-outline',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  // Animation refs for premium entrance animations
  const headerRef = useRef<Animatable.View & View>(null);
  const contentRef = useRef<Animatable.View & View>(null);
  const footerRef = useRef<Animatable.View & View>(null);

  // Animation values
  const imageAnimation = useRef(new Animated.Value(0)).current;
  const titleAnimation = useRef(new Animated.Value(0)).current;
  const descAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(0)).current;

  // Premium entrance animations on mount
  React.useEffect(() => {
    const animateSequence = async () => {
      if (headerRef.current) {
        headerRef.current.animate({
          0: { opacity: 0, translateY: -30 },
          1: { opacity: 1, translateY: 0 }
        }, 1000);
      }
      
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.animate({
            0: { opacity: 0, transform: [{ scale: 0.9 }] },
            1: { opacity: 1, transform: [{ scale: 1 }] }
          }, 800);
        }
      }, 300);
      
      setTimeout(() => {
        if (footerRef.current) {
          footerRef.current.animate({
            0: { opacity: 0, translateY: 30 },
            1: { opacity: 1, translateY: 0 }
          }, 800);
        }
      }, 600);
    };
    
    animateSequence();
  }, []);

  const onViewChangeRef = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index || 0);
      
      // Reset animations
      imageAnimation.setValue(0);
      titleAnimation.setValue(0);
      descAnimation.setValue(0);
      buttonAnimation.setValue(0);
      
      // Start premium animations in sequence with improved timing
      Animated.stagger(150, [
        Animated.spring(imageAnimation, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(titleAnimation, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(descAnimation, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(buttonAnimation, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  });

  // Get interpolated background colors based on scroll position
  const backgroundColor1 = scrollX.interpolate({
    inputRange: slides.map((_, i) => i * width),
    outputRange: slides.map(slide => slide.darkGradientColors[0]),
    extrapolate: 'clamp',
  });
  
  const backgroundColor2 = scrollX.interpolate({
    inputRange: slides.map((_, i) => i * width),
    outputRange: slides.map(slide => slide.darkGradientColors[1]),
    extrapolate: 'clamp',
  });

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.navigate('Login');
    }
  };

  // Enhanced animation styles with premium effects
  const imageStyle = {
    opacity: imageAnimation,
    transform: [
      {
        scale: imageAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1],
        }),
      },
      {
        translateY: imageAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0],
        }),
      },
      {
        rotate: imageAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: ['5deg', '0deg'],
        }),
      },
    ],
  };
  
  const titleStyle = {
    opacity: titleAnimation,
    transform: [
      {
        translateY: titleAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0],
        }),
      },
      {
        scale: titleAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };
  
  const descriptionStyle = {
    opacity: descAnimation,
    transform: [
      {
        translateY: descAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
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
      {
        scale: buttonAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Premium animated background gradient */}
      <View style={StyleSheet.absoluteFillObject}>
        {slides.map((slide, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width
          ];
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp'
          });
          
          return (
            <Animated.View 
              key={index}
              style={[
                StyleSheet.absoluteFillObject,
                { opacity }
              ]}
            >
              <LinearGradient
                colors={slide.darkGradientColors}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
          );
        })}
      </View>
      
      <SafeAreaView style={styles.content}>
        {/* Premium Header */}
        <Animatable.View ref={headerRef} style={styles.header}>
          {/* Enhanced Progress indicators */}
          <View style={styles.progressContainer}>
            {slides.map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: 
                      index === currentIndex
                        ? '#FFFFFF'
                        : 'rgba(255, 255, 255, 0.3)',
                    width: index === currentIndex ? 32 : 8,
                    transform: [
                      {
                        scale: index === currentIndex ? 1.2 : 1,
                      }
                    ],
                  },
                ]}
              />
            ))}
          </View>
          
          {/* Premium Skip button with glassmorphism */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.skipButtonGradient}
            >
              <Text style={styles.skipText}>Skip</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animatable.View>
        
        {/* Premium Content */}
        <Animatable.View ref={contentRef} style={styles.contentContainer}>
          <Animated.FlatList
            ref={flatListRef}
            data={slides}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewChangeRef.current}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                {/* Premium animated icon and image */}
                <Animated.View style={[styles.imageContainer, imageStyle]}>
                  <Image
                    source={item.image}
                    style={[styles.slideImage, { tintColor: 'rgba(255, 255, 255, 0.08)' }]}
                    resizeMode="contain"
                  />
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.iconCircle}
                  >
                    <OnboardingIcon name={item.icon} size={56} color="#fff" />
                    <View style={styles.iconGlow} />
                  </LinearGradient>
                </Animated.View>
                
                {/* Premium Text content */}
                <Animated.Text style={[styles.title, titleStyle]}>
                  {item.title}
                </Animated.Text>
                
                <Animated.Text style={[styles.description, descriptionStyle]}>
                  {item.description}
                </Animated.Text>
              </View>
            )}
          />
        </Animatable.View>
        
        {/* Premium Footer */}
        <Animatable.View ref={footerRef} style={styles.buttonContainer}>
          <Animated.View style={buttonStyle}>
            <TouchableOpacity
              style={styles.nextButton}
              activeOpacity={0.9}
              onPress={handleNext}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8F9FA']}
                style={styles.nextButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.nextButtonText}>
                  {currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
                </Text>
                {Platform.OS === 'ios' ? (
                  <Text style={[styles.nextButtonText, styles.nextButtonIcon]}>
                    {currentIndex === slides.length - 1 ? '✨' : '→'}
                  </Text>
                ) : (
                  <Icon 
                    name={currentIndex === slides.length - 1 ? 'rocket-launch' : 'arrow-right'} 
                    size={22} 
                    color="#1A1A1A" 
                    style={styles.nextButtonIcon} 
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animatable.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  skipButton: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  skipButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  contentContainer: {
    flex: 1,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  imageContainer: {
    width: width * 0.75,
    height: width * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  iconCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: -1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.8,
    lineHeight: 42,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      },
    }),
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
    letterSpacing: 0.2,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  nextButton: {
    borderRadius: 32,
    overflow: 'hidden',
    width: width * 0.85,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 32,
  },
  nextButtonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  nextButtonIcon: {
    marginLeft: 8,
    fontSize: 20,
  },
}); 
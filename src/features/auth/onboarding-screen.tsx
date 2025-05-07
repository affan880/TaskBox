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

type OnboardingNavigationProp = StackNavigationProp<AuthStackParamList, 'Onboarding'>;

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to TaskBox',
    description: 'Organize your tasks, emails, and schedule all in one beautiful place',
    image: require('../../../assets/images/blob1.png'),
    gradientColors: ['#1A1A1A', '#2D2D2D'],
    icon: 'inbox-multiple',
  },
  {
    id: '2',
    title: 'Stay Organized',
    description: 'Create to-do lists, set reminders, and never miss a deadline again',
    image: require('../../../assets/images/blob2.png'),
    gradientColors: ['#2D2D2D', '#1A1A1A'],
    icon: 'check-circle-outline',
  },
  {
    id: '3',
    title: 'Manage Your Emails',
    description: 'Connect your Gmail account to manage emails without leaving the app',
    image: require('../../../assets/images/blob1.png'),
    gradientColors: ['#1A1A1A', '#2D2D2D'],
    icon: 'email-outline',
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  // Animation values
  const imageAnimation = useRef(new Animated.Value(0)).current;
  const titleAnimation = useRef(new Animated.Value(0)).current;
  const descAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(0)).current;

  const onViewChangeRef = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index || 0);
      
      // Reset animations
      imageAnimation.setValue(0);
      titleAnimation.setValue(0);
      descAnimation.setValue(0);
      buttonAnimation.setValue(0);
      
      // Start animations in sequence with improved timing
      Animated.stagger(100, [
        Animated.spring(imageAnimation, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(titleAnimation, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(descAnimation, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(buttonAnimation, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  });

  // Get interpolated background colors based on scroll position
  const backgroundColor1 = scrollX.interpolate({
    inputRange: slides.map((_, i) => i * width),
    outputRange: slides.map(slide => slide.gradientColors[0]),
    extrapolate: 'clamp',
  });
  
  const backgroundColor2 = scrollX.interpolate({
    inputRange: slides.map((_, i) => i * width),
    outputRange: slides.map(slide => slide.gradientColors[1]),
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

  // Enhanced animation styles
  const imageStyle = {
    opacity: imageAnimation,
    transform: [
      {
        scale: imageAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
      {
        translateY: imageAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
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
          outputRange: [30, 0],
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
          outputRange: [30, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Animated background gradient */}
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
                colors={slide.gradientColors}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>
          );
        })}
      </View>
      
      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          {/* Progress indicators */}
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
                        : 'rgba(255, 255, 255, 0.2)',
                    width: index === currentIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
          
          {/* Skip button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        
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
              {/* Animated icon and image */}
              <Animated.View style={[styles.imageContainer, imageStyle]}>
                <Image
                  source={item.image}
                  style={[styles.slideImage, { tintColor: 'rgba(255, 255, 255, 0.05)' }]}
                  resizeMode="contain"
                />
                <View style={styles.iconCircle}>
                  <OnboardingIcon name={item.icon} size={50} color="#fff" />
                </View>
              </Animated.View>
              
              {/* Text content */}
              <Animated.Text style={[styles.title, titleStyle]}>
                {item.title}
              </Animated.Text>
              
              <Animated.Text style={[styles.description, descriptionStyle]}>
                {item.description}
              </Animated.Text>
            </View>
          )}
        />
        
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <TouchableOpacity
            style={styles.nextButton}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            {Platform.OS === 'ios' ? (
              <Text style={[styles.nextButtonText, styles.nextButtonIcon]}>
                {currentIndex === slides.length - 1 ? '→' : '→'}
              </Text>
            ) : (
              <Icon 
                name={currentIndex === slides.length - 1 ? 'login' : 'arrow-right'} 
                size={20} 
                color="#1A1A1A" 
                style={styles.nextButtonIcon} 
              />
            )}
          </TouchableOpacity>
        </Animated.View>
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
    paddingTop: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  iconCircle: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    letterSpacing: 0.3,
  },
  buttonContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 30,
    width: width * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  nextButtonIcon: {
    marginLeft: 4,
  },
}); 
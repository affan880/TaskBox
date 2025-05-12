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
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/auth-navigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Welcome to Plexar',
    description: 'Organize your tasks, emails, and schedule all in one beautiful place',
    backgroundColor: '#ff3333',
    textColor: '#FFFFFF'
  },
  {
    id: '2',
    title: 'Stay Organized',
    description: 'Create to-do lists, set reminders, and never miss a deadline again',
    backgroundColor: '#0066ff',
    textColor: '#FFFFFF'
  },
  {
    id: '3',
    title: 'Manage Your Emails',
    description: 'Connect your Gmail account to manage emails without leaving the app',
    backgroundColor: '#ffde59',
    textColor: '#000000',
    descriptionBg: '#000000',
    descriptionColor: '#FFFFFF'
  },
];

type OnboardingNavigationProp = StackNavigationProp<AuthStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  // Animation values
  const contentAnimation = React.useRef(new Animated.Value(0)).current;
  const buttonAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Animate elements in sequence
    Animated.stagger(300, [
      Animated.timing(contentAnimation, {
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
  }, []);

  // Common animation styles
  const contentStyle = {
    opacity: contentAnimation,
    transform: [
      {
        translateY: contentAnimation.interpolate({
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

  const onViewChangeRef = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  });

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            {slides.map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentIndex && styles.activeDot,
                  {
                    backgroundColor: index === currentIndex 
                      ? slides[currentIndex].backgroundColor 
                      : '#FFFFFF'
                  }
                ]}
              />
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
        
        {/* Content */}
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
          style={contentStyle}
          renderItem={({ item }) => (
            <ScrollView 
              style={styles.slide}
              contentContainerStyle={styles.slideContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.contentBox, { backgroundColor: item.backgroundColor }]}>
                <Text style={[styles.title, { color: item.textColor }]}>
                  {item.title}
                </Text>
                <Text style={[
                  styles.description, 
                  { 
                    color: item.descriptionColor || item.textColor,
                    backgroundColor: item.descriptionBg || '#000000',
                  }
                ]}>
                  {item.description}
                </Text>
              </View>
            </ScrollView>
          )}
        />
        
        {/* Footer */}
        <Animated.View style={[styles.footer, buttonStyle]}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: slides[currentIndex].backgroundColor }
            ]}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <Text style={[
              styles.nextButtonText,
              { color: slides[currentIndex].textColor }
            ]}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Icon 
              name={currentIndex === slides.length - 1 ? 'login' : 'arrow-right'} 
              size={24} 
              color={slides[currentIndex].textColor}
              style={styles.nextButtonIcon}
            />
          </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#000000',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeDot: {
    width: 24,
    transform: [{ rotate: '2deg' }],
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    transform: [{ rotate: '2deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  skipText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  slide: {
    width,
    flex: 1,
  },
  slideContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  contentBox: {
    width: width * 0.85,
    padding: 30,
    borderWidth: 4,
    borderColor: '#000000',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'left',
    transform: [{ rotate: '2deg' }],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'left',
    transform: [{ rotate: '1deg' }],
    backgroundColor: '#000000',
    padding: 16,
    marginTop: 16,
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.85,
    padding: 20,
    borderWidth: 4,
    borderColor: '#000000',
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextButtonIcon: {
    transform: [{ rotate: '-5deg' }],
  },
}); 
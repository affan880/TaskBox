import * as React from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { OnboardingIcon } from '@/components/icons/OnboardingIcons';

const { width } = Dimensions.get('window');

type OnboardingSlideProps = {
  title: string;
  description: string;
  image: any;
  icon: string;
  imageStyle: any;
  titleStyle: any;
  descriptionStyle: any;
};

export function OnboardingSlide({
  title,
  description,
  image,
  icon,
  imageStyle,
  titleStyle,
  descriptionStyle,
}: OnboardingSlideProps) {
  return (
    <View style={styles.slide}>
      {/* Animated icon and image */}
      <Animated.View style={[styles.imageContainer, imageStyle]}>
        <Image
          source={image}
          style={[styles.slideImage, { tintColor: 'rgba(255, 255, 255, 0.05)' }]}
          resizeMode="contain"
        />
        <View style={styles.iconCircle}>
          <OnboardingIcon name={icon} size={50} color="#fff" />
        </View>
      </Animated.View>
      
      {/* Text content */}
      <Animated.Text style={[styles.title, titleStyle]}>
        {title}
      </Animated.Text>
      
      <Animated.Text style={[styles.description, descriptionStyle]}>
        {description}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -20,
  },
  imageContainer: {
    width: width * 0.8,
    height: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    transform: [{ rotate: '2deg' }],
  },
  slideImage: {
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  iconCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 12,
    transform: [{ rotate: '-3deg' }],
  },
  title: {
    fontSize: 48,
    fontFamily: 'Montserrat-Bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
    transform: [{ rotate: '1deg' }],
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  description: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    letterSpacing: 0.3,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#ffffff',
    padding: 16,
    borderWidth: 4,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    transform: [{ rotate: '-1deg' }],
  },
}); 
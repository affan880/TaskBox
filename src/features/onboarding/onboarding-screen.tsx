import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { useTheme } from '@/theme/theme-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Button } from '@/components/ui/button';

type OnboardingScreenProps = {
  navigation: any;
};

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleOpenTerms = () => {
    Linking.openURL('https://taskbox.space/Terms-of-Use.html');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://taskbox.space/Privacy-Policy.html');
  };

  const handleGetStarted = () => {
    navigation.navigate('Terms');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      
      <LinearGradient
        colors={[colors.brand.primary, colors.brand.secondary]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Welcome to TaskBox</Text>
          <Text style={styles.headerSubtitle}>Your Personal Task Manager</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Icon name="check-circle" size={32} color={colors.brand.primary} />
            <Text style={[styles.featureText, { color: colors.text.primary }]}>
              Organize your tasks efficiently
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="clock-outline" size={32} color={colors.brand.primary} />
            <Text style={[styles.featureText, { color: colors.text.primary }]}>
              Track your progress
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="sync" size={32} color={colors.brand.primary} />
            <Text style={[styles.featureText, { color: colors.text.primary }]}>
              Sync across devices
            </Text>
          </View>
        </View>

        <View style={styles.legalContainer}>
          <Text style={[styles.legalText, { color: colors.text.secondary }]}>
            By continuing, you agree to our{' '}
            <Text 
              style={[styles.legalLink, { color: colors.brand.primary }]}
              onPress={handleOpenTerms}
            >
              Terms of Use
            </Text>
            {' '}and{' '}
            <Text 
              style={[styles.legalLink, { color: colors.brand.primary }]}
              onPress={handleOpenPrivacy}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <Button
            variant="primary"
            onPress={handleGetStarted}
            style={styles.getStartedButton}
          >
            Get Started
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureText: {
    fontSize: 18,
    fontWeight: '500',
  },
  legalContainer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  legalText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 20,
  },
  getStartedButton: {
    width: '100%',
  },
}); 
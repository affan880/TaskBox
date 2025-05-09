import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type SettingsStackParamList = {
  Settings: undefined;
  PrivacyPolicy: undefined;
};

type PrivacyPolicyScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'PrivacyPolicy'>;

export function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>    
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Information We Collect</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>We collect information that you provide directly to us, including your name, email address, and any other information you choose to provide. We also collect information about your use of our services, including your tasks, projects, and email interactions.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>How We Use Your Information</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>We use the information we collect to provide, maintain, and improve our services, to develop new features, and to protect Plexar and our users. We also use this information to communicate with you about our services.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Information Sharing</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>We do not share your personal information with third parties except as described in this privacy policy. We may share your information with service providers who assist us in providing our services.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Data Security</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your Rights</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>You have the right to access, correct, or delete your personal information. You can also object to our processing of your personal information or request that we restrict our processing of your personal information.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Changes to This Policy</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Contact Us</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>If you have any questions about this privacy policy, please contact us at privacy@Plexar.app</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
}); 
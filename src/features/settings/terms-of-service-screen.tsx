import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type SettingsStackParamList = {
  Settings: undefined;
  TermsOfService: undefined;
};

type TermsOfServiceScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'TermsOfService'>;

export function TermsOfServiceScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>    
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Acceptance of Terms</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>By accessing or using TaskBox, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing TaskBox.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Use License</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>Permission is granted to temporarily use TaskBox for personal, non-commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not:</Text>
          <Text style={[styles.bulletPoint, { color: colors.text.secondary }]}>• Modify or copy the materials</Text>
          <Text style={[styles.bulletPoint, { color: colors.text.secondary }]}>• Use the materials for any commercial purpose</Text>
          <Text style={[styles.bulletPoint, { color: colors.text.secondary }]}>• Attempt to decompile or reverse engineer any software contained in TaskBox</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>User Account</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>To use certain features of TaskBox, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>User Content</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>You retain all rights to any content you submit, post, or display on or through TaskBox. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Disclaimer</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>TaskBox is provided "as is". We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Limitations</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>In no event shall TaskBox or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use TaskBox.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Revisions and Errata</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>The materials appearing on TaskBox could include technical, typographical, or photographic errors. We do not warrant that any of the materials on TaskBox are accurate, complete, or current.</Text>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Contact Information</Text>
          <Text style={[styles.text, { color: colors.text.secondary }]}>If you have any questions about these Terms of Service, please contact us at legal@taskbox.app</Text>
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
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 16,
    marginTop: 4,
  },
}); 
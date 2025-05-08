import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/button';

type SettingsStackParamList = {
  Settings: undefined;
  HelpSupport: undefined;
};

type HelpSupportScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'HelpSupport'>;

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

type SupportOption = {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
};

export function HelpSupportScreen() {
  const navigation = useNavigation<HelpSupportScreenNavigationProp>();
  const { colors } = useTheme();
  const [expandedFaq, setExpandedFaq] = React.useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How do I connect my Gmail account?',
      answer: 'Go to Settings > Account Management > Connected Account and follow the prompts to connect your Gmail account. You\'ll need to grant permission for TaskBox to access your emails.',
    },
    {
      id: '2',
      question: 'How does Smart Sort work?',
      answer: 'Smart Sort uses AI to analyze your emails and automatically categorize them based on their content, sender, and context. It learns from your manual categorizations to improve over time.',
    },
    {
      id: '3',
      question: 'Can I use TaskBox offline?',
      answer: 'Yes, TaskBox works offline. Your tasks and projects are stored locally, and emails will sync when you\'re back online.',
    },
    {
      id: '4',
      question: 'How do I export my data?',
      answer: 'You can export your data by going to Settings > Account Management > Export Data. This will create a ZIP file containing all your tasks, projects, and email categories.',
    },
  ];

  const supportOptions: SupportOption[] = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Get help via email',
      icon: 'email',
      action: () => Linking.openURL('mailto:support@taskbox.app'),
    },
    {
      id: 'chat',
      title: 'Live Chat',
      description: 'Chat with our support team',
      icon: 'chat',
      action: () => Linking.openURL('https://taskbox.app/support/chat'),
    },
    {
      id: 'docs',
      title: 'Documentation',
      description: 'Browse our help center',
      icon: 'book-open-variant',
      action: () => Linking.openURL('https://taskbox.app/docs'),
    },
    {
      id: 'community',
      title: 'Community Forum',
      description: 'Join our user community',
      icon: 'forum',
      action: () => Linking.openURL('https://community.taskbox.app'),
    },
  ];

  const handleExpand = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Support Options</Text>
        {supportOptions.map((option) => (
          <TouchableOpacity
            key={option.title}
            style={styles.supportOption}
            onPress={option.action}
          >
            <Icon name={option.icon} size={22} color={colors.brand.primary} style={{ marginRight: 12 }} />
            <Text style={[styles.supportOptionText, { color: colors.text.primary }]}>{option.title}</Text>
          </TouchableOpacity>
        ))}
        <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: 24 }]}>FAQs</Text>
        {faqItems.map((faq, idx) => (
          <View key={faq.question} style={styles.faqItem}>
            <TouchableOpacity onPress={() => handleExpand(idx)} style={styles.faqQuestionRow}>
              <Text style={[styles.faqQuestion, { color: colors.text.primary }]}>{faq.question}</Text>
              <Icon name={expandedFaq === idx ? 'chevron-up' : 'chevron-down'} size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            {expandedFaq === idx && (
              <Text style={[styles.faqAnswer, { color: colors.text.secondary }]}>{faq.answer}</Text>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.contactButton} onPress={supportOptions[0].action}>
          <Icon name="email-outline" size={20} color={colors.brand.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.contactButtonText, { color: colors.brand.primary }]}>Contact Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  supportOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  faqItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    paddingTop: 0,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginTop: 32,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { version } from '../../../../package.json';

const FEEDBACK_TYPES = [
  {
    id: 'bug',
    title: 'Report a Bug',
    icon: 'bug',
    description: 'Let us know about any issues you encounter',
  },
  {
    id: 'feature',
    title: 'Feature Request',
    icon: 'lightbulb',
    description: 'Suggest new features or improvements',
  },
  {
    id: 'general',
    title: 'General Feedback',
    icon: 'message',
    description: 'Share your thoughts or ideas',
  },
];

export function FeedbackScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [selectedType, setSelectedType] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select a feedback type');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your feedback message');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement your feedback submission logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('[FeedbackScreen] Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { 
        borderBottomColor: colors.border.light,
        backgroundColor: colors.background.primary 
      }]}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Send Feedback
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          What kind of feedback do you have?
        </Text>

        <View style={styles.typeContainer}>
          {FEEDBACK_TYPES.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                { 
                  backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary,
                  borderColor: selectedType === type.id ? colors.primary : colors.border.light,
                }
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Icon 
                name={type.icon} 
                size={24} 
                color={selectedType === type.id ? colors.primary : colors.text.tertiary} 
              />
              <Text style={[styles.typeTitle, { color: colors.text.primary }]}>
                {type.title}
              </Text>
              <Text style={[styles.typeDescription, { color: colors.text.secondary }]}>
                {type.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Your Message
        </Text>

        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary,
              color: colors.text.primary,
              borderColor: colors.border.light,
            }
          ]}
          placeholder="Describe your feedback in detail..."
          placeholderTextColor={colors.text.tertiary}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Text style={[styles.disclaimer, { color: colors.text.tertiary }]}>
          By submitting feedback, you agree to share app information including version ({version}) and platform ({Platform.OS}).
        </Text>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { 
              backgroundColor: colors.primary,
              opacity: isSubmitting ? 0.7 : 1,
            }
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 88 : 56,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
  },
  typeContainer: {
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  submitButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
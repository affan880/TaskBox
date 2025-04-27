import * as React from 'react';
import { View, TextInput, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';

// Define the Recipient type locally
type Recipient = {
  email: string;
  name?: string;
};

interface RecipientSelectorProps {
  recipients: Recipient[];
  onAddRecipient: (recipient: Recipient) => void;
  onRemoveRecipient: (index: number) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function RecipientSelector({
  recipients,
  onAddRecipient,
  onRemoveRecipient,
  onFocus,
  onBlur,
}: RecipientSelectorProps): React.ReactElement {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<TextInput>(null);

  const handleSubmitRecipient = React.useCallback(() => {
    if (!inputValue.trim()) return;
    
    const email = inputValue.trim();
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(email)) {
      onAddRecipient({ email, name: email });
      setInputValue('');
    }
  }, [inputValue, onAddRecipient]);

  const handleKeyPress = React.useCallback(({ nativeEvent }: { nativeEvent: { key: string } }) => {
    if (
      nativeEvent.key === 'Backspace' && 
      inputValue === '' && 
      recipients.length > 0
    ) {
      onRemoveRecipient(recipients.length - 1);
    }
  }, [inputValue, recipients.length, onRemoveRecipient]);

  return (
    <View style={[styles.container, { borderBottomColor: colors.border.light }]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>To:</Text>
      </View>
      
      <ScrollView 
        horizontal 
        style={styles.chipScrollView}
        contentContainerStyle={styles.chipContainer}
        showsHorizontalScrollIndicator={false}
      >
        {recipients.map((recipient, index) => (
          <View 
            key={`${recipient.email}-${index}`}
            style={[styles.chip, { backgroundColor: colors.background.secondary }]}
          >
            <Text style={[styles.chipText, { color: colors.text.primary }]}>
              {recipient.name || recipient.email}
            </Text>
            <TouchableOpacity 
              onPress={() => onRemoveRecipient(index)}
              style={styles.removeButton}
              accessibilityLabel={`Remove ${recipient.name || recipient.email}`}
            >
              <Icon name="close" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ))}
        
        <TextInput
          ref={inputRef}
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleSubmitRecipient}
          onKeyPress={handleKeyPress}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={recipients.length === 0 ? "Add recipient email" : ""}
          placeholderTextColor={colors.text.primary}
          returnKeyType="done"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { color: colors.text.primary }]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  labelContainer: {
    width: 40,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  chipScrollView: {
    flex: 1,
    height: 40,
  },
  chipContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    marginRight: 4,
  },
  removeButton: {
    padding: 4,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    padding: 0,
    minWidth: 100,
  },
}); 
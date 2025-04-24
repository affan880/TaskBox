import * as React from 'react';
import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';

interface ChipInputProps {
  values: string[];
  onChangeValues: (values: string[]) => void;
  placeholder?: string;
  inputStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  chipStyle?: StyleProp<ViewStyle>;
  chipTextStyle?: StyleProp<TextStyle>;
  validate?: (value: string) => boolean;
  autoFocus?: boolean;
}

export function ChipInput({
  values,
  onChangeValues,
  placeholder = 'Add item...',
  inputStyle,
  containerStyle,
  chipStyle,
  chipTextStyle,
  validate,
  autoFocus = false,
}: ChipInputProps) {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleAddValue = (text: string) => {
    const trimmedText = text.trim();
    
    // Prevent empty values
    if (!trimmedText) return;
    
    // Validate if validation function is provided
    if (validate && !validate(trimmedText)) {
      // Could show error, but for email we'll just continue
      // as we'll validate all emails before sending
      return;
    }
    
    // Add to values array if it doesn't already exist
    if (!values.includes(trimmedText)) {
      onChangeValues([...values, trimmedText]);
    }
    
    // Clear input
    setInputValue('');
  };

  const handleRemoveValue = (index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChangeValues(newValues);
  };

  const handleInputChange = (text: string) => {
    // Check if text contains separators (comma, semicolon, or space)
    if (text.includes(',') || text.includes(';') || (text.includes(' ') && Platform.OS === 'ios')) {
      // Split text by separators
      const separatedValues = text
        .split(/[,;\s]/)
        .map(val => val.trim())
        .filter(val => val !== '');
      
      // Add each value
      separatedValues.forEach(value => {
        handleAddValue(value);
      });
      
      // Clear input
      setInputValue('');
    } else {
      setInputValue(text);
    }
  };

  const handleSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    handleAddValue(e.nativeEvent.text);
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      handleAddValue(inputValue);
    }
  };

  // Helper to check if the field is empty to handle backspace deletion
  const isInputEmpty = inputValue === '';

  // Handle backspace on empty input to remove the last chip
  const handleKeyPress = ({ nativeEvent }: { nativeEvent: { key: string } }) => {
    if (isInputEmpty && nativeEvent.key === 'Backspace' && values.length > 0) {
      handleRemoveValue(values.length - 1);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.chipContainer}>
        {values.map((value, index) => (
          <View
            key={`${value}-${index}`}
            style={[
              styles.chip,
              { backgroundColor: `${colors.brand.primary}15` },
              chipStyle,
            ]}
          >
            <Text style={[
              styles.chipText,
              { color: colors.text.primary },
              chipTextStyle
            ]}>
              {value}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveValue(index)}
            >
              <Icon name="close" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ))}

        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { color: colors.text.primary },
            inputStyle,
          ]}
          value={inputValue}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSubmitEditing}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    margin: 2,
  },
  chipText: {
    fontSize: 14,
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
  input: {
    flex: 1,
    minWidth: 100,
    height: 32,
    fontSize: 14,
    paddingHorizontal: 4,
  },
}); 
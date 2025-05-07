import * as React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/theme-context';
import FeatherIcon from 'react-native-vector-icons/Feather';

type EmailInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  disabled?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
};

export function EmailInput({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  secureTextEntry = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
}: EmailInputProps): React.ReactElement {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = React.useState(false);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
      ...style,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
      color: colors.text.primary,
      ...labelStyle,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: error ? colors.status.error :
                 isFocused ? colors.brand.primary :
                 colors.border.light,
      borderRadius: 8,
      backgroundColor: disabled ? colors.background.secondary : colors.background.primary,
    },
    leftIconContainer: {
      paddingLeft: 12,
      paddingRight: 8,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 12,
      color: colors.text.primary,
      fontSize: 16,
      ...inputStyle,
    },
    rightIconContainer: {
      paddingRight: 12,
      paddingLeft: 8,
    },
    error: {
      fontSize: 12,
      color: colors.status.error,
      marginTop: 4,
      ...errorStyle,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <FeatherIcon
              name={leftIcon}
              size={20}
              color={colors.text.secondary}
            />
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          style={styles.input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            disabled={disabled}
          >
            <FeatherIcon
              name={rightIcon}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
} 
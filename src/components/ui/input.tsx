import * as React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { colors } from '../../utils/styling';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};

export function Input({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.neutral[300], colors.primary],
  });

  const handleInputPress = () => {
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (props.onFocus) {
      props.onFocus;
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (props.onBlur) {
      props.onBlur;
    }
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      
      <Pressable onPress={handleInputPress} accessibilityRole="none">
        <Animated.View 
          style={[
            styles.inputContainer,
            { borderColor: error ? colors.danger : borderColor },
            style
          ]}
        >
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholderTextColor={colors.neutral[400]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            accessibilityLabel={accessibilityLabel || label || props.placeholder}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ 
              disabled: !!props.editable === false
            }}
            {...props}
          />
          
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </Animated.View>
      </Pressable>
      
      {error ? (
        <Text 
          style={styles.errorText} 
          accessibilityRole="text"
          accessibilityLabel={`Error: ${error}`}
        >
          {error}
        </Text>
      ) : helper ? (
        <Text 
          style={styles.helperText} 
          accessibilityRole="text"
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
    height: 48,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.neutral[800],
  },
  iconLeft: {
    paddingLeft: 12,
  },
  iconRight: {
    paddingRight: 12,
  },
  helperText: {
    marginTop: 4,
    fontSize: 14,
    color: colors.neutral[500],
  },
  errorText: {
    marginTop: 4,
    fontSize: 14,
    color: colors.danger,
  },
}); 
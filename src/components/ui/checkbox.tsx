import * as React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Text } from './text';

type CheckboxProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  style?: any;
};

export function Checkbox({
  value,
  onValueChange,
  label,
  disabled = false,
  style,
}: CheckboxProps) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <View
        style={[
          styles.checkbox,
          value ? styles.checked : styles.unchecked,
          disabled && styles.disabled,
        ]}
      >
        {value && (
          <View style={styles.checkmark} />
        )}
      </View>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    borderWidth: 1,
  },
  checked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  unchecked: {
    borderColor: '#d1d5db',
  },
  checkmark: {
    height: 10,
    width: 10,
    borderRadius: 2,
    backgroundColor: 'white',
  },
  label: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  disabled: {
    opacity: 0.5,
  },
}); 
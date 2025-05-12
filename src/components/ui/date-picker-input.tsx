import React, { useState } from 'react';
import { TouchableOpacity, View, Platform, Text, StyleSheet } from 'react-native'; // Import core components and StyleSheet
import RNDateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context'; // Import useTheme

// No styled HOC used

type Props = {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

// Helper to format date (adjust format as needed)
const formatDate = (date: Date | null): string => {
  if (!date) {
    return 'Select Date';
  }
  // Example format: DD/MM/YYYY
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getFullYear()}`;
};

export function DatePickerInput({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: Props): React.ReactElement {
  const [showPicker, setShowPicker] = useState(false);
  const { colors, isDark } = useTheme(); // Get theme colors

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ): void => {
    const currentDate = selectedDate || value; // Keep current value if no date selected (e.g., dismissal)
    setShowPicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android after selection/dismissal
    if (event.type === 'set' && currentDate) {
      onChange(currentDate);
    } else if (event.type === 'dismissed') {
        // Handle dismissal if needed, currently does nothing
    }
     // Explicitly close for Android if needed, though setting state should trigger re-render
     if (Platform.OS === 'android') {
        setShowPicker(false);
     }
  };

  const showDatepicker = (): void => {
    setShowPicker(true);
  };

  // Define styles using StyleSheet
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    touchable: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 9999, // large value for pill shape
      borderWidth: 1,
      borderColor: colors.border.medium, // Use theme color
      backgroundColor: colors.background.secondary, // Use theme color
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    icon: {
      marginRight: 8,
    },
    text: {
      flex: 1,
      fontSize: 14,
      color: colors.text.primary, // Use theme color
    },
  });

  return (
    <View style={styles.container}>
      {/* Button to trigger the picker - uses inline style prop */}
      <TouchableOpacity style={styles.touchable} onPress={showDatepicker}>
        <FeatherIcon
          name="calendar"
          size={18}
          color={colors.text.secondary} // Use theme color for icon
          style={styles.icon}
        />
        <Text style={styles.text}>{formatDate(value)}</Text>
      </TouchableOpacity>

      {/* The Actual DateTimePicker */}
      {showPicker && (
        <RNDateTimePicker
          testID="dateTimePicker"
          value={value || new Date()} // Provide a default value if null
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} // 'spinner' for iOS, 'default' (modal/spinner) for Android
          onChange={handleDateChange}
          
        //   minimumDate={minimumDate}
        //   maximumDate={maximumDate}
          // Optional: Apply theme-based text color for the picker itself if possible/needed
          // textColor={colors.text.primary} // Note: textColor prop might be iOS only
        />
      )}
    </View>
  );
} 
import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { useTheme } from '../../theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

type DateTimePickerMode = 'date' | 'time' | 'datetime';
type DateTimePickerDisplay = 'default' | 'spinner' | 'calendar' | 'clock';

type DateTimePickerProps = {
  value: Date;
  mode?: DateTimePickerMode;
  display?: DateTimePickerDisplay;
  onChange: (event: any, date?: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

/**
 * A simple fallback implementation of DateTimePicker.
 * In a real app, you should use @react-native-community/datetimepicker.
 */
export default function DateTimePicker({
  value,
  mode = 'date',
  display = 'default',
  onChange,
  minimumDate,
  maximumDate
}: DateTimePickerProps) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = React.useState(true);
  
  const handleCancel = () => {
    setModalVisible(false);
    onChange({ type: 'dismissed' }, undefined);
  };
  
  const handleConfirm = () => {
    setModalVisible(false);
    onChange({ type: 'set' }, value);
  };
  
  const handleDateChange = (days: number) => {
    const newDate = new Date(value.getTime());
    newDate.setDate(newDate.getDate() + days);
    
    // Check min/max bounds
    if (minimumDate && newDate < minimumDate) return;
    if (maximumDate && newDate > maximumDate) return;
    
    onChange({ type: 'change' }, newDate);
  };
  
  if (!modalVisible) return null;
  
  return (
    <Modal
      transparent={true}
      visible={modalVisible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface.primary }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {mode === 'date' ? 'Select Date' : mode === 'time' ? 'Select Time' : 'Select Date & Time'}
            </Text>
          </View>
          
          <View style={styles.content}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => handleDateChange(-1)}
            >
              <Icon name="arrow-back-ios" size={24} color={colors.brand.primary} />
            </TouchableOpacity>
            
            <View style={styles.dateDisplay}>
              <Text style={[styles.dateText, { color: colors.text.primary }]}>
                {mode === 'date' || mode === 'datetime' ? 
                  value.toLocaleDateString() : 
                  value.toLocaleDateString()
                }
              </Text>
              {mode === 'time' || mode === 'datetime' ? (
                <Text style={[styles.timeText, { color: colors.text.secondary }]}>
                  {value.toLocaleTimeString()}
                </Text>
              ) : null}
            </View>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => handleDateChange(1)}
            >
              <Icon name="arrow-forward-ios" size={24} color={colors.brand.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCancel}
            >
              <Text style={{ color: colors.text.accent }}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleConfirm}
            >
              <Text style={{ color: colors.brand.primary, fontWeight: '600' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 
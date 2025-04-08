import * as React from 'react';
import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

type SnoozeModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectSnoozeTime: (date: Date) => Promise<void>;
};

type PresetTime = {
  label: string;
  days?: number;
  hours?: number;
  minutes?: number;
};

export function SnoozeModal({
  visible,
  onClose,
  onSelectSnoozeTime,
}: SnoozeModalProps) {
  const [isSelecting, setIsSelecting] = useState(false);

  function getNextWeekendDays(): { saturday: Date; sunday: Date } {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSaturday = (6 - currentDay + 7) % 7;
    const daysUntilSunday = (7 - currentDay) % 7;

    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    nextSaturday.setHours(9, 0, 0, 0);

    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    nextSunday.setHours(9, 0, 0, 0);

    return { saturday: nextSaturday, sunday: nextSunday };
  }

  const getSnoozeTime = (preset: PresetTime): Date => {
    const now = new Date();
    const snoozeTime = new Date(now);

    if (preset.days) {
      snoozeTime.setDate(now.getDate() + preset.days);
    }
    if (preset.hours) {
      snoozeTime.setHours(now.getHours() + preset.hours);
    }
    if (preset.minutes) {
      snoozeTime.setMinutes(now.getMinutes() + preset.minutes);
    }

    // Round to nearest minute
    snoozeTime.setSeconds(0, 0);

    return snoozeTime;
  };

  const handleSelectTime = async (preset: PresetTime) => {
    if (isSelecting) return;

    setIsSelecting(true);
    try {
      const snoozeTime = getSnoozeTime(preset);
      await onSelectSnoozeTime(snoozeTime);
      onClose();
    } catch (error) {
      console.error('Failed to snooze email:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  const { saturday, sunday } = getNextWeekendDays();

  const presetTimes: PresetTime[] = [
    { label: 'Later today', hours: 3 },
    { label: 'Tomorrow morning', days: 1, hours: 9 },
    { label: 'Tomorrow afternoon', days: 1, hours: 14 },
    { label: 'Tomorrow evening', days: 1, hours: 18 },
    { label: 'This weekend', days: 0 }, // Special case, will use next Saturday
    { label: 'Next week', days: 7, hours: 9 },
    { label: 'Next month', days: 30, hours: 9 },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Snooze until</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsList}>
            {presetTimes.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.option}
                onPress={() => handleSelectTime(preset)}
                disabled={isSelecting}
              >
                <Text style={styles.optionText}>{preset.label}</Text>
                <Text style={styles.optionTime}>
                  {preset.label === 'This weekend'
                    ? saturday.toLocaleString(undefined, {
                        weekday: 'long',
                        hour: 'numeric',
                        minute: 'numeric',
                      })
                    : getSnoozeTime(preset).toLocaleString(undefined, {
                        weekday: 'long',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '80%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  optionsList: {
    flexGrow: 0,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  optionText: {
    fontSize: 16,
    marginBottom: 4,
  },
  optionTime: {
    fontSize: 14,
    color: '#666',
  },
}); 
import * as React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { DatePickerInput } from '@/components/ui/date-picker-input';

type CreateProjectModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
};

export function CreateProjectModal({ visible, onClose, onSubmit }: CreateProjectModalProps) {
  const { colors } = useTheme();
  
  const [projectTitle, setProjectTitle] = React.useState('');
  const [projectDescription, setProjectDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState<Date | null>(new Date());
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [dateError, setDateError] = React.useState('');

  const validateDates = (): boolean => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError('End date cannot be earlier than start date');
      return false;
    }
    setDateError('');
    return true;
  };

  const handleSubmit = () => {
    if (!projectTitle.trim()) {
      return;
    }

    if (!validateDates()) {
      return;
    }

    onSubmit({
      title: projectTitle,
      description: projectDescription,
      startDate,
      endDate,
    });

    // Reset form
    setProjectTitle('');
    setProjectDescription('');
    setStartDate(new Date());
    setEndDate(null);
    setDateError('');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background.primary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border.medium }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Create Project</Text>
            <TouchableOpacity 
              style={[styles.closeButton, { 
                backgroundColor: colors.surface.primary,
                borderColor: colors.border.medium 
              }]} 
              onPress={onClose}
            >
              <Icon name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: colors.text.primary }]}>Title</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: colors.surface.primary,
                    color: colors.text.primary,
                    borderColor: colors.border.medium
                  }
                ]}
                placeholder="Project title"
                placeholderTextColor={colors.text.secondary}
                value={projectTitle}
                onChangeText={setProjectTitle}
              />
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: colors.text.primary }]}>Description (optional)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  { 
                    backgroundColor: colors.surface.primary,
                    color: colors.text.primary,
                    borderColor: colors.border.medium
                  }
                ]}
                placeholder="Project description..."
                placeholderTextColor={colors.text.secondary}
                value={projectDescription}
                onChangeText={setProjectDescription}
                multiline={true}
                numberOfLines={4}
              />
            </View>

            {/* Start Date */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: colors.text.primary }]}>Start Date</Text>
              <DatePickerInput
                label="Start Date"
                value={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  if (endDate) validateDates();
                }}
              />
            </View>

            {/* End Date */}
            <View style={styles.formSection}>
              <Text style={[styles.formLabel, { color: colors.text.primary }]}>End Date (optional)</Text>
              <DatePickerInput
                label="End Date"
                value={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  if (date && startDate) validateDates();
                }}
              />
              {dateError ? (
                <Text style={[styles.dateError, { color: colors.status.error }]}>{dateError}</Text>
              ) : null}
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: colors.brand.primary,
                  borderWidth: 3,
                  borderColor: '#000000',
                }
              ]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.createButtonText, 
                { 
                  color: colors.text.inverse,
                }
              ]}>
                Create Project
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 3,
    padding: 20,
    paddingBottom: 30,
    maxHeight: '80%',
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 3,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 4,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    transform: [{ rotate: '-1deg' }],
  },
  textInput: {
    borderWidth: 3,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 6,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateError: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
    transform: [{ rotate: '1deg' }],
  },
  createButton: {
    marginTop: 24,
    borderRadius: 12,
    borderWidth: 3,
    paddingVertical: 16,
    transform: [{ rotate: '2deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    transform: [{ rotate: '-1deg' }],
  },
}); 
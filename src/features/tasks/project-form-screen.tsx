import * as React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/app-navigator';
import { useProjectStore } from '@/store/project-store';
import { useTheme } from '@/theme/theme-context';
import { Button } from '@/components/ui/button';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import Icon from 'react-native-vector-icons/MaterialIcons';

type ProjectFormScreenRouteProp = RouteProp<RootStackParamList, 'ProjectForm'>;
type ProjectFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProjectForm'>;

export function ProjectFormScreen() {
  const navigation = useNavigation<ProjectFormScreenNavigationProp>();
  const route = useRoute<ProjectFormScreenRouteProp>();
  const { projectId } = route.params;
  const { getProject, addProject, updateProject } = useProjectStore();
  const { colors } = useTheme();

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [startDate, setStartDate] = React.useState<Date | null>(null);
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const loadProject = async () => {
      if (projectId) {
        try {
          const project = await getProject(projectId);
          setTitle(project.title);
          setDescription(project.description || '');
          setStartDate(project.startDate ? new Date(project.startDate) : null);
          setEndDate(project.endDate ? new Date(project.endDate) : null);
        } catch (error) {
          console.error('Error loading project:', error);
        }
      }
    };

    loadProject();
  }, [projectId, getProject]);

  const handleSave = async () => {
    if (!title.trim()) {
      // Show error
      return;
    }

    setIsLoading(true);
    try {
      const projectData = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      };

      if (projectId) {
        await updateProject(projectId, projectData);
      } else {
        await addProject(projectData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {projectId ? 'Edit Project' : 'New Project'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Title</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.surface.primary,
              color: colors.text.primary,
              borderColor: colors.border.medium
            }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter project title"
            placeholderTextColor={colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { 
              backgroundColor: colors.surface.primary,
              color: colors.text.primary,
              borderColor: colors.border.medium
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter project description"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Start Date</Text>
          <DatePickerInput
            value={startDate}
            onChange={setStartDate}
            maximumDate={endDate || undefined}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>End Date</Text>
          <DatePickerInput
            value={endDate}
            onChange={setEndDate}
            minimumDate={startDate || undefined}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Project'}
        </Button>
      </View>
    </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
}); 
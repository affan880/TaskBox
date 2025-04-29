import * as React from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/theme-context';
import { useProjectStore } from '@/store/project-store';
import { ProjectWithTasks } from '@/types/project';
import { Button } from '@/components/ui/button';
import { createStyles } from '../styles';

type ExtendedProjectWithTasks = ProjectWithTasks & {
  startDate?: string;
  endDate?: string;
};

type Props = {
  styles: any;
  colors: any;
  isDark: boolean;
  onNavigate: (project?: ExtendedProjectWithTasks) => void;
};

export function ProjectSection({ styles, colors, isDark, onNavigate }: Props) {
  const { projects, deleteProject } = useProjectStore();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<ExtendedProjectWithTasks | null>(null);
  
  // Get the most recent project with tasks
  const recentProject = projects.length > 0 
    ? projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    : null;

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      deleteProject(selectedProject.id);
      setIsDeleteModalVisible(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Failed to delete project:', error);
      Alert.alert('Error', 'Failed to delete project. Please try again.');
    }
  };

  if (!recentProject) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="view-grid-outline" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your project</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate()}>
            <FeatherIcon name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.projectCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.projectTitle, { color: colors.text.primary, textAlign: 'center' }]}>No projects yet</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.brand.primary, marginTop: 16, alignSelf: 'center' }]}
            onPress={() => onNavigate()}
          >
            <Text style={{ color: colors.text.inverse, fontWeight: '600' }}>Create Project</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Get project with tasks
  const projectWithTasks = useProjectStore.getState().getProjectWithTasks(recentProject.id) as ExtendedProjectWithTasks;
  if (!projectWithTasks) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="view-grid-outline" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your project</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate()}>
            <FeatherIcon name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.projectCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.projectTitle, { color: colors.text.primary, textAlign: 'center' }]}>Project not found</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.brand.primary, marginTop: 16, alignSelf: 'center' }]}
            onPress={() => onNavigate()}
          >
            <Text style={{ color: colors.text.inverse, fontWeight: '600' }}>Create Project</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const completedTasks = projectWithTasks.tasks.filter(task => task.isCompleted).length;
  const totalTasks = projectWithTasks.tasks.length;
  const progressPercent = `${Math.round((completedTasks / totalTasks) * 100)}%`;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialCommunityIcons name="view-grid-outline" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your project</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => {
              setSelectedProject(projectWithTasks);
              setIsDeleteModalVisible(true);
            }}
            style={{ marginRight: 16 }}
          >
            <FeatherIcon name="trash-2" size={20} color={colors.status.error} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate(projectWithTasks)}>
            <FeatherIcon name="chevron-right" size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.projectCard, { backgroundColor: colors.surface.primary }]}>
        <View style={styles.projectCardTopRow}>
          <Text style={[styles.projectTitle, { color: colors.text.primary }]}>{projectWithTasks.title}</Text>
        </View>
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.dateText, { color: colors.text.secondary }]}>
              {projectWithTasks.startDate ? new Date(projectWithTasks.startDate).toLocaleDateString() : 'No start date'}
            </Text>
          </View>
          <Text style={[styles.dateSeparator, { color: colors.text.tertiary }]}>→</Text>
          <View style={styles.dateItem}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.dateText, { color: colors.text.secondary }]}>
              {projectWithTasks.endDate ? new Date(projectWithTasks.endDate).toLocaleDateString() : 'No end date'}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={[styles.progressText, { color: colors.text.primary }]}>{progressPercent}</Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.surface.secondary }]}>
            <View style={[styles.progressFill, { width: progressPercent, backgroundColor: colors.brand.primary }]} />
          </View>
          <Text style={[styles.taskCountText, { color: colors.text.secondary }]}>
            {`${completedTasks}/${totalTasks} tasks`}
          </Text>
        </View>
      </View>

      {/* Delete Project Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.deleteModalContent, { backgroundColor: colors.surface.primary }]}>
            <Text style={[styles.deleteModalTitle, { color: colors.text.primary }]}>
              Delete Project
            </Text>
            <Text style={[styles.deleteModalText, { color: colors.text.secondary }]}>
              Are you sure you want to delete this project? This action cannot be undone and will delete all associated tasks.
            </Text>
            <View style={styles.deleteModalButtons}>
              <Button
                variant="outline"
                onPress={() => setIsDeleteModalVisible(false)}
                style={styles.deleteModalButton}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={handleDeleteProject}
                style={styles.deleteModalButton}
              >
                Delete
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
} 
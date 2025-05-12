import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';
import { useProjectStore } from '@/store/slices/project-slice';
import { ProjectWithTasks } from '@/types/project';
import { ProjectItem } from '@/components/projects/project-item';
import { SearchBar } from '@/components/projects/search-bar';
import { EmptyProjectList } from '@/components/projects/empty-project-list';
import { CreateProjectModal } from '@/components/projects/create-project-modal';

type RootStackParamList = {
  TaskList: { projectId: string };
};

type NavigationPropType = NavigationProp<RootStackParamList>;

export function ProjectListScreen() {
  const navigation = useNavigation<NavigationPropType>();
  const { colors } = useTheme();
  
  // Store access
  const { 
    getAllProjectsWithTasks, 
    addProject, 
    deleteProject, 
    updateProject 
  } = useProjectStore();
  
  // Component state
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Load projects on mount
  useEffect(() => {
    refreshProjects();
  }, []);
  
  const refreshProjects = () => {
    const projectsWithTasks = getAllProjectsWithTasks();
    setProjects(projectsWithTasks);
  };
  
  // Filter projects based on search
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleAddProject = () => setIsModalVisible(true);
  
  const handleCloseModal = () => {
    setIsModalVisible(false);
  };
  
  const handleCreateProject = async (data: {
    title: string;
    description: string;
    startDate: Date | null;
    endDate: Date | null;
  }) => {
    try {
      // Create the project
      const newProject = addProject({
        title: data.title,
        description: data.description,
        startDate: data.startDate?.toISOString(),
        endDate: data.endDate?.toISOString(),
      });
      
      // Refresh projects list
      refreshProjects();
      
      handleCloseModal();
      
      // Navigate to the task list screen with the new project ID
      navigation.navigate('TaskList', { projectId: newProject.id });
    } catch (error) {
      console.error('Failed to create project:', error);
      Alert.alert('Error', 'Failed to create project. Please try again.');
    }
  };
  
  const handleDeleteProject = (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? All associated tasks will be removed from this project.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              deleteProject(projectId);
              refreshProjects();
            } catch (error) {
              console.error('Failed to delete project:', error);
              Alert.alert('Error', 'Failed to delete project. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = async (projectId: string, currentStatus: boolean) => {
    try {
      // Update project completion status
      await updateProject(projectId, { isCompleted: !currentStatus });
      
      // Refresh the projects list to update UI
      refreshProjects();
    } catch (error) {
      console.error('Failed to update project status:', error);
      Alert.alert('Error', 'Failed to update project status. Please try again.');
    }
  };
  
  const handleNavigateToTaskList = (projectId: string) => {
    navigation.navigate('TaskList', { projectId });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Projects</Text>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Project List */}
        {filteredProjects.length > 0 ? (
          <FlatList
            style={styles.projectList}
            data={filteredProjects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ProjectItem
                project={item}
                onPress={handleNavigateToTaskList}
                onDelete={handleDeleteProject}
                onToggleComplete={handleToggleComplete}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyProjectList />
        )}
      </View>

      {/* Add Project FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.brand.primary }]} 
        onPress={handleAddProject}
      >
        <Icon name="add" size={28} color={colors.text.inverse} />
      </TouchableOpacity>

      {/* Create Project Modal */}
      <CreateProjectModal
        visible={isModalVisible}
        onClose={handleCloseModal}
        onSubmit={handleCreateProject}
      />
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 3,
    transform: [{ rotate: '-1deg' }],
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  projectList: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '2deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
  },
}); 
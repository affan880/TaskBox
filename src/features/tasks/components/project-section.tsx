import * as React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProjectStore } from '@/store/slices/project-slice';
import { useTaskStore } from '@/store/slices/task-slice';
import { ProjectWithTasks } from '@/types/project';
import { TaskData } from '@/types/task';
import { createStyles } from '../styles';
import Carousel from 'react-native-reanimated-carousel';

type ExtendedProjectWithTasks = ProjectWithTasks & {
  startDate?: string;
  endDate?: string;
};

type Props = {
  colors: any;
  isDark: boolean;
  onNavigate: (project?: ExtendedProjectWithTasks) => void;
};

export function ProjectSection({ colors, isDark, onNavigate }: Props) {
  const { projects, getProjectWithTasks } = useProjectStore();
  const { getTasks } = useTaskStore();
  const { width: screenWidth } = Dimensions.get('window');
  const [tasks, setTasks] = React.useState<TaskData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const styles = React.useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  
  // Load tasks and projects
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const loadedTasks = await getTasks();
        setTasks(loadedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [getTasks]);

  // Get all projects with tasks
  const projectsWithTasks = React.useMemo(() => {
    if (!projects || projects.length === 0) return [];

    return projects
      .map(project => {
        const projectWithTasks = getProjectWithTasks(project.id);
        if (!projectWithTasks) return null;
        
        // Filter tasks for this project
        const projectTasks = tasks.filter(task => task.projectId === project.id);
        
        return {
          ...projectWithTasks,
          tasks: projectTasks,
          startDate: project.startDate,
          endDate: project.endDate
        } as ExtendedProjectWithTasks;
      })
      .filter((project): project is ExtendedProjectWithTasks => project !== null)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects, tasks, getProjectWithTasks]);

  const renderProjectCard = ({ item: project }: { item: ExtendedProjectWithTasks }) => {
    const completedTasks = project.tasks.filter(task => task.isCompleted).length;
    const totalTasks = project.tasks.length;
    const progressPercent = totalTasks > 0 
      ? `${Math.round((completedTasks / totalTasks) * 100)}%`
      : '0%';

    return (
      <View style={[styles.projectCard, { backgroundColor: colors.surface.primary }]}>
        <View style={styles.projectCardTopRow}>
          <Text style={[styles.projectTitle, { color: colors.text.primary }]}>{project.title}</Text>
        </View>
        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.dateText, { color: colors.text.secondary }]}>
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No start date'}
            </Text>
          </View>
          <Text style={[styles.dateSeparator, { color: colors.text.tertiary }]}>→</Text>
          <View style={styles.dateItem}>
            <FeatherIcon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={[styles.dateText, { color: colors.text.secondary }]}>
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No end date'}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <Text style={[styles.progressText, { color: colors.text.primary }]}>{progressPercent}</Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.surface.secondary }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: totalTasks > 0 ? Number(progressPercent.replace('%', '')) : 0,
                  backgroundColor: colors.brand.primary 
                }
              ]} 
            />
          </View>
          <Text style={[styles.taskCountText, { color: colors.text.secondary }]}>
            {`${completedTasks}/${totalTasks} tasks`}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.viewProjectButton, { backgroundColor: colors.brand.primary }]}
          onPress={() => onNavigate(project)}
        >
          <Text style={[styles.viewProjectButtonText, { color: colors.text.inverse }]}>View Project</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="view-grid-outline" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your projects</Text>
          </View>
        </View>
        <View style={[styles.projectCard, { backgroundColor: colors.surface.primary }]}>
          <Text style={[styles.projectTitle, { color: colors.text.primary, textAlign: 'center' }]}>Loading projects...</Text>
        </View>
      </View>
    );
  }

  if (!projectsWithTasks || projectsWithTasks.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="view-grid-outline" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your projects</Text>
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
            <FeatherIcon name="plus" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <MaterialCommunityIcons name="view-grid-outline" size={24} color={colors.brand.primary} style={styles.sectionIcon} />
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Your projects</Text>
        </View>
        <TouchableOpacity onPress={() => onNavigate()}>
          <FeatherIcon name="chevron-right" size={24} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>

      <Carousel
        loop
        width={screenWidth - 48}
        height={220}
        data={projectsWithTasks}
        renderItem={renderProjectCard}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        style={styles.carouselContainer}
      />
    </View>
  );
} 
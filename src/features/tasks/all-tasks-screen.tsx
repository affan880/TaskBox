import * as React from 'react';
import { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme } from '@/theme/theme-context';
import { useTaskStore } from '@/store/task-store';
import { TaskData, TaskPriority } from '@/types/task';

type SortOption = 'dueDate' | 'priority' | 'createdAt';
type FilterOption = 'all' | 'active' | 'completed';

type RootStackParamList = {
  TaskList: { tasks: TaskData[] };
  ProjectDetail: { projectId?: string };
  TaskCreation: undefined;
  AllTasks: undefined;
};

type NavigationPropType = NavigationProp<RootStackParamList>;

export function AllTasksScreen() {
  const navigation = useNavigation<NavigationPropType>();
  const { colors, isDark } = useTheme();
  const { tasks, toggleTaskCompletion } = useTaskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (activeFilter === 'active') {
      filtered = filtered.filter(task => !task.isCompleted);
    } else if (activeFilter === 'completed') {
      filtered = filtered.filter(task => task.isCompleted);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, searchQuery, activeFilter, sortBy]);

  const handleGoBack = () => navigation.goBack();

  const renderTaskItem = ({ item }: { item: TaskData }) => (
    <TouchableOpacity 
      style={[
        styles.taskItem,
        { backgroundColor: colors.surface.primary }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.checkbox,
          { 
            borderColor: item.isCompleted ? colors.brand.primary : colors.border.medium,
            backgroundColor: item.isCompleted ? colors.brand.primary : 'transparent'
          }
        ]}
        onPress={() => toggleTaskCompletion(item.id)}
      >
        {item.isCompleted && (
          <FeatherIcon name="check" size={16} color={colors.text.inverse} />
        )}
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text 
          style={[
            styles.taskTitle,
            { color: colors.text.primary },
            item.isCompleted && styles.taskTitleCompleted
          ]}
        >
          {item.title}
        </Text>
        
        {item.description && (
          <Text 
            style={[styles.taskDescription, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}
        
        <View style={styles.taskFooter}>
          {item.dueDate && (
            <View style={styles.taskDateContainer}>
              <FeatherIcon name="calendar" size={14} color={colors.text.tertiary} />
              <Text style={[styles.taskDate, { color: colors.text.tertiary }]}>
                {new Date(item.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          <View style={[
            styles.taskPriority,
            { 
              backgroundColor: 
                item.priority === 'high' ? `${colors.status.error}20` :
                item.priority === 'medium' ? `${colors.status.warning}20` :
                `${colors.status.success}20`
            }
          ]}>
            <Text style={[
              styles.taskPriorityText,
              { 
                color: 
                  item.priority === 'high' ? colors.status.error :
                  item.priority === 'medium' ? colors.status.warning :
                  colors.status.success
              }
            ]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          All Tasks
        </Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface.primary }]}>
        <Icon name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search tasks..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'active', 'completed'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              activeFilter === filter && { backgroundColor: colors.brand.primary }
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: activeFilter === filter ? colors.text.inverse : colors.text.primary }
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={[styles.sortLabel, { color: colors.text.secondary }]}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {(['dueDate', 'priority', 'createdAt'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                sortBy === option && { backgroundColor: colors.brand.primary }
              ]}
              onPress={() => setSortBy(option)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  { color: sortBy === option ? colors.text.inverse : colors.text.primary }
                ]}
              >
                {option === 'dueDate' ? 'Due Date' :
                 option === 'priority' ? 'Priority' : 'Created'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Task List */}
      <FlatList
        data={filteredAndSortedTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.taskList}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              No tasks found
            </Text>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sortLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskList: {
    padding: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  taskDescription: {
    fontSize: 14,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  taskDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  taskDate: {
    fontSize: 14,
  },
  taskPriority: {
    padding: 4,
    borderRadius: 4,
  },
  taskPriorityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
}); 
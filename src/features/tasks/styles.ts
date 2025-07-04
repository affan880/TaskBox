import { StyleSheet } from 'react-native';

export const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerContainer: { 
    paddingHorizontal: 16,
    paddingTop: 16, 
    paddingBottom: 8,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTopRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleContainer: { 
    flex: 1,
  },
  headerTitle: { 
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerTitleIcon: { 
    marginLeft: 8,
  },
  addButton: { 
    backgroundColor: colors.brand.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchBarContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#374151' : '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: { 
    marginRight: 8,
  },
  searchInput: { 
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 4, 
  },
  tabsContainer: {
    flexDirection: 'row',
    // borderBottomWidth: 1,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: colors.brand.primary, 
  },
  contentContainer: {
    flex: 1,
    paddingTop: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: { 
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  projectCard: {
    backgroundColor: isDark ? colors.background.secondary : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  projectCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: isDark ? colors.background.secondary : '#FFFFFF',
    marginLeft: -8,
  },
  avatarMore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDBA74',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: isDark ? colors.background.secondary : '#FFFFFF',
    marginLeft: -8,
  },
  avatarMoreText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 6,
  },
  dateSeparator: {
    color: colors.text.tertiary,
    marginHorizontal: 4,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    marginRight: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.background.tertiary, 
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  taskCountText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 12,
  },
  recentTaskCard: {
    backgroundColor: isDark ? colors.background.secondary : '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  recentTaskIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: colors.background.tertiary,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recentTaskInfo: {
    flex: 1,
  },
  recentTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  recentTaskDeadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentTaskDeadlineText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 6,
  },
  emptyAnalyticsContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
      paddingHorizontal: 20,
  },
  emptyAnalyticsText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text.secondary,
      textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
  },
  modalScroll: {
    paddingHorizontal: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activePriorityOption: {
    borderWidth: 1.5,
  },
  priorityOptionText: {
    fontSize: 14,
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskListEmpty: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskListEmptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.text.tertiary,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 12,
    marginLeft: 4,
  },
  taskPriority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskPriorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewAllButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 100,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  taskStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    width: '100%',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
  },
  taskProgressContainer: {
    width: '100%',
  },
  taskProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskProgressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskProgressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  taskProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  taskStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  taskStatLabel: {
    fontSize: 14,
  },
  priorityStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  priorityStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityStatText: {
    fontSize: 12,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
    width: 60,
  },
  filterButtons: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  filterButtonContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  calendarSection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  selectedDateSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  addTaskButton: {
    backgroundColor: colors.brand.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  taskListContainer: {
    gap: 12,
  },
  calendarTaskItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  calendarTaskPriorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  calendarTaskContent: {
    flex: 1,
    marginRight: 12,
  },
  calendarTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  calendarTaskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  calendarTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarTaskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  calendarTaskTimeText: {
    fontSize: 12,
  },
  calendarTaskTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarTaskTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  calendarTaskTagText: {
    fontSize: 12,
  },
  calendarTaskStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  calendarTaskStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyDateContainer: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  emptyDateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  carouselContainer: {
    marginTop: 16,
  },
  carouselContentContainer: {
    paddingHorizontal: 8,
  },
  viewProjectButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewProjectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Analytics Section Styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  additionalStats: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  additionalStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  insightLabel: {
    fontSize: 14,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 
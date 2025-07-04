import * as React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  StyleSheet,
  Animated,
  Platform
} from 'react-native';
import { EmailListItem } from './email-list-item';
import { useTheme } from 'src/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../theme/theme';
import type { EmailData } from 'src/types/email';

// Only log in development mode
const DEBUG = __DEV__ && false; // Set to true to enable verbose logging

type MultiSelectActionBarProps = {
  selectedCount: number;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onDelete: () => void;
  onClose: () => void;
};

function MultiSelectActionBar({ 
  selectedCount, 
  onMarkAsRead, 
  onMarkAsUnread, 
  onDelete, 
  onClose 
}: MultiSelectActionBarProps) {
  const { colors } = useTheme();
  
  return (
    <Animated.View 
      style={[
        styles.actionBar,
        { 
          backgroundColor: colors.background?.primary || '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 4,
        }
      ]}
    >
      <View style={styles.actionBarLeft}>
        <Text style={[styles.selectedCount, { color: colors.text?.primary || '#111827' }]}>
          {selectedCount} selected
        </Text>
      </View>
      
      <View style={styles.actionBarRight}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onMarkAsRead}
        >
          <Icon name="mark-email-read" size={24} color={colors.brand?.primary || '#6366f1'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onMarkAsUnread}
        >
          <Icon name="mark-email-unread" size={24} color={colors.brand?.primary || '#6366f1'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
        >
          <Icon name="delete" size={24} color="#ef4444" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onClose}
        >
          <Icon name="close" size={24} color={colors.text?.secondary || '#4b5563'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export type EmailListProps = {
  emails: EmailData[];
  refreshing: boolean;
  handleRefresh: () => void;
  handleOpenEmail: (emailId: string) => Promise<void>;
  handleLongPress: (emailId: string) => void;
  selectedEmails: string[];
  isMultiSelectMode: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  initialLoadComplete: boolean;
  handleLoadMore: () => void;
  selectedCategory: string;
  onSmartSort?: () => void;
  isAnalyzing?: boolean;
  searchQuery?: string;
  onMarkAsRead?: (emailIds: string[]) => void;
  onMarkAsUnread?: (emailIds: string[]) => void;
  onDelete?: (emailIds: string[]) => void;
  onCloseMultiSelect?: () => void;
  onToggleRead?: (emailId: string, isUnread: boolean) => void;
  autoCategorizationEnabled?: boolean;
};

export function EmailList({ 
  emails,
  refreshing,
  handleRefresh,
  handleOpenEmail,
  handleLongPress,
  selectedEmails,
  isMultiSelectMode,
  isLoading,
  isLoadingMore,
  initialLoadComplete,
  handleLoadMore,
  selectedCategory,
  onSmartSort,
  isAnalyzing = false,
  searchQuery = '',
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onCloseMultiSelect,
  onToggleRead,
  autoCategorizationEnabled = true,
}: EmailListProps) {
  const { colors } = useTheme();
  const [isListReady, setIsListReady] = React.useState(false);
  const flatListRef = React.useRef<FlatList>(null);
  const lastCategoryChangeTime = React.useRef<number>(Date.now());
  
  // Add debug logging for category changes
  React.useEffect(() => {
    console.log('[EmailList] Category changed:', {
      selectedCategory,
      emailsCount: emails.length,
      isLoading,
      initialLoadComplete,
      isListReady,
      hasSmartSort: !!onSmartSort
    });
  }, [selectedCategory, emails.length, isLoading, initialLoadComplete, isListReady, onSmartSort]);

  // Set list as ready after the first render is complete
  React.useEffect(() => {
    if (initialLoadComplete && emails.length > 0 && !isListReady) {
      console.log('[EmailList] Setting list as ready:', {
        emailsCount: emails.length,
        initialLoadComplete,
        isListReady
      });
      
      // Use a smaller delay to ensure list is responsive
      const timer = setTimeout(() => {
        setIsListReady(true);
        console.log('[EmailList] List is now ready for load more');
      }, 300); // Reduced from 1000ms to 300ms
      
      return () => clearTimeout(timer);
    }
  }, [initialLoadComplete, emails.length, isListReady]);
  
  // Reset list ready state and track category change time when category changes
  React.useEffect(() => {
    console.log('[EmailList] Category change detected:', {
      newCategory: selectedCategory,
      previousReadyState: isListReady
    });
    
    setIsListReady(false);
    lastCategoryChangeTime.current = Date.now();
  }, [selectedCategory]);

  // Debug log for emails updates
  React.useEffect(() => {
    console.log('[EmailList] Emails updated:', {
      count: emails?.length || 0,
      category: selectedCategory,
      isLoading,
      initialLoadComplete
    });
  }, [emails, selectedCategory, isLoading, initialLoadComplete]);

  // Handle load more with debounce after category changes
  const handleLoadMoreWrapper = React.useCallback(() => {
    // Ignore load more requests within 500ms of a category change
    const timeSinceCategoryChange = Date.now() - lastCategoryChangeTime.current;
    const tooSoonAfterCategoryChange = timeSinceCategoryChange < 500;
    
    console.log('[EmailList] Load more requested:', {
      isLoadingMore,
      refreshing,
      timeSinceCategoryChange,
      tooSoonAfterCategoryChange
    });
    
    // Only block load more if we're already loading more or refreshing or too soon after category change
    if (isLoadingMore || refreshing || tooSoonAfterCategoryChange) {
      console.log('[EmailList] Ignoring load more request');
      return;
    }
    
    console.log('[EmailList] Proceeding with load more');
    handleLoadMore();
  }, [isLoadingMore, refreshing, handleLoadMore]);

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
        <Text style={[styles.loadingMoreText, { color: colors.text.secondary }]}>
          Loading more emails...
        </Text>
      </View>
    );
  };

  // Modified loading condition - emails.length is checked as a fallback
  // Show loader when either: 
  // 1. We're loading and haven't completed initial load
  // 2. We're loading and have no emails yet
  if ((isLoading && !initialLoadComplete) || (isLoading && emails.length === 0)) {
    if (DEBUG) console.log('EmailList: Displaying loading indicator');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background?.secondary || '#f7f8fa' }]}>
        <ActivityIndicator size="large" color={colors.brand?.primary || '#6366f1'} />
        <Text style={[styles.loadingText, { color: colors.text?.secondary || '#4b5563' }]}>
          Loading your emails...
        </Text>
      </View>
    );
  }

  // Empty state for the email list  
  if (!isLoading && emails.length === 0) {
    if (DEBUG) console.log('EmailList: Displaying empty state');
    
    let message = `No emails found in "${selectedCategory}"`;
    let description = 'Pull down to refresh or try another category';
    
    if (searchQuery) {
      message = `No results found for "${searchQuery}"`;
      description = 'Try a different search term';
    }
    
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background?.secondary || '#f7f8fa' }]}>
        <Icon name={searchQuery ? 'search-off' : 'drafts'} size={64} color={colors.text?.tertiary || '#9ca3af'} />
        <Text style={[styles.emptyTitle, { color: colors.text?.primary || '#111827' }]}>
          {message}
        </Text>
        <Text style={[styles.emptyMessage, { color: colors.text?.secondary || '#4b5563' }]}>
          {description}
        </Text>
        
        {selectedCategory === 'All' && (
          <TouchableOpacity 
            style={[
              styles.refreshButton, 
              { 
                backgroundColor: colors.brand?.primary || '#6366f1',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 20,
                marginTop: 16,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }
            ]}
            onPress={handleRefresh}
          >
            <Icon name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Refresh</Text>
          </TouchableOpacity>
        )}

        {selectedCategory !== 'All' && !searchQuery && onSmartSort && (
          <TouchableOpacity 
            style={[
              styles.smartSortButton, 
              { 
                backgroundColor: colors.brand?.primary || '#6366f1',
                marginTop: 12,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 20,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }
            ]}
            onPress={onSmartSort}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Icon name="sort" size={18} color="#ffffff" style={styles.smartSortIcon} />
                <Text style={styles.smartSortText}>Smart Sort</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Debug output for when we're rendering the actual list
  if (DEBUG) console.log(`EmailList: Rendering FlatList with ${emails.length} emails`);
  
  return (
    <View style={styles.container}>
      {isMultiSelectMode && (
        <MultiSelectActionBar
          selectedCount={selectedEmails.length}
          onMarkAsRead={() => onMarkAsRead?.(selectedEmails)}
          onMarkAsUnread={() => onMarkAsUnread?.(selectedEmails)}
          onDelete={() => onDelete?.(selectedEmails)}
          onClose={onCloseMultiSelect || (() => {})}
        />
      )}
      
      <FlatList
        ref={flatListRef}
        contentContainerStyle={[
          styles.listContent,
          emails.length === 0 && { flex: 1 } // Add flex: 1 when empty to enable pull-to-refresh
        ]}
        data={emails}
        renderItem={({ item }) => {
          return (
            <EmailListItem
              email={item}
              onPress={() => handleOpenEmail(item.id)}
              onLongPress={() => handleLongPress(item.id)}
              isSelected={isMultiSelectMode && selectedEmails.includes(item.id)}
              onToggleRead={onToggleRead || (() => {})}
            />
          );
        }}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand.primary]}
            tintColor={colors.brand.primary}
            progressViewOffset={Platform.OS === 'android' ? 20 : 0} // Add offset for Android
            progressBackgroundColor={colors.background.secondary}
          />
        }
        ListEmptyComponent={() => {
          // Check if it's an active search with no results after loading
          const isSearchActiveAndEmpty = searchQuery.trim().length > 0 && !isLoading && emails.length === 0;

          if (isSearchActiveAndEmpty) {
            return (
              <View style={[styles.emptyContainer, { flex: 1 }]}>
                <Icon name="search_off" size={64} color={colors.text.tertiary} />
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  No results found for "{searchQuery}"
                </Text>
                {selectedCategory === 'All' && (
                  <TouchableOpacity 
                    style={[
                      styles.refreshButton, 
                      { 
                        backgroundColor: colors.brand?.primary || '#6366f1',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 20,
                        marginTop: 16,
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }
                    ]}
                    onPress={handleRefresh}
                  >
                    <Icon name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Refresh</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }
          
          if (selectedCategory !== "All" && !isLoading) {
            return (
              <View style={[styles.emptyContainer, { flex: 1 }]}>
                <Icon name="filter_list" size={64} color={colors.text.tertiary} />
                <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                  No emails in this category
                </Text>
                {onSmartSort && (
                  <TouchableOpacity 
                    style={[
                      styles.smartSortButton, 
                      { 
                        backgroundColor: colors.brand.primary,
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 20,
                        marginTop: 16,
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                      }
                    ]}
                    onPress={onSmartSort}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" style={styles.buttonIcon} />
                        <Text style={styles.smartSortButtonText}>Analyzing...</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="sort" size={18} color="#ffffff" style={styles.buttonIcon} />
                        <Text style={styles.smartSortButtonText}>Smart Sort</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          }
          
          return (
            <View style={[styles.emptyContainer, { flex: 1 }]}>
              <Icon name="inbox" size={64} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                {isLoading ? 'Loading emails...' : 'No emails found'}
              </Text>
              {selectedCategory === 'All' && !isLoading && (
                <TouchableOpacity 
                  style={[
                    styles.refreshButton, 
                    { 
                      backgroundColor: colors.brand?.primary || '#6366f1',
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 20,
                      marginTop: 16,
                      elevation: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }
                  ]}
                  onPress={handleRefresh}
                >
                  <Icon name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Refresh</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListFooterComponent={renderFooter()}
        onEndReached={handleLoadMoreWrapper}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </View>
  );
}

// Add displayName property
EmailList.displayName = 'EmailList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 16, // Reduced from 130px to 16px to fix the spacing issue
    paddingBottom: 20, // Add bottom padding for better scroll experience
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
    minHeight: 300, // Add minimum height to ensure pull-to-refresh works
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
    marginTop: SPACING.md,
  },
  loaderFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  loadingMoreText: {
    marginLeft: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  smartSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  smartSortButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    // borderWidth: 2, // TEMP for debugging
    // borderColor: 'blue', // TEMP for debugging
    // No position, bottom, left, right, borderTopLeftRadius, borderTopRightRadius
  },
  actionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    marginLeft: 8,
    borderRadius: 20,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingMore: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
  },
  smartSortIcon: {
    marginRight: 8,
  },
  smartSortText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
}); 
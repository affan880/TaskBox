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
  Platform,
  Image
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

  // Modified loading condition
  if ((isLoading && !initialLoadComplete) || (isLoading && emails.length === 0 && selectedCategory !== 'All')) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background?.secondary }]}>
        <ActivityIndicator size="large" color={colors.brand?.primary} />
        <Text style={[styles.loadingText, { color: colors.text?.secondary }]}>
          {isAnalyzing ? 'Analyzing your emails...' : 'Loading your emails...'}
        </Text>
      </View>
    );
  }

  // Empty state for the email list  
  if (!isLoading && emails.length === 0) {
    return (
      <View style={[styles.emptyContainer, { 
        backgroundColor: colors.background?.secondary,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }]}>
        <Icon 
          name={searchQuery ? 'search-off' : 'drafts'} 
          size={64} 
          color={colors.text?.tertiary} 
        />
        <Text style={[styles.emptyTitle, { 
          color: colors.text?.primary,
          textAlign: 'center',
          marginTop: 16,
        }]}>
          {searchQuery ? `No results found for "${searchQuery}"` : `No emails found in "${selectedCategory}"`}
        </Text>
        <Text style={[styles.emptyMessage, { 
          color: colors.text?.secondary,
          textAlign: 'center',
          marginTop: 8,
        }]}>
          {searchQuery ? 'Try a different search term' : 'Pull down to refresh or try another category'}
        </Text>
        
        {/* Add Smart Sort Button if enabled */}
        {onSmartSort && !searchQuery && (
          <TouchableOpacity
            style={[
              styles.smartSortButton,
              { 
                backgroundColor: colors.brand?.primary,
                marginTop: 24,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 0,
                borderWidth: 3,
                borderColor: '#000000',
                transform: [{ rotate: '2deg' }],
                shadowColor: '#000000',
                shadowOffset: { width: 4, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 0,
                elevation: 8,
              }
            ]}
            onPress={onSmartSort}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={[styles.smartSortButtonText, { color: '#FFFFFF' }]}>Analyzing...</Text>
              </>
            ) : (
              <>
                <Image 
                  source={require('@/assets/images/feather.png')}
                  style={[styles.buttonIcon, { width: 20, height: 20, tintColor: '#FFFFFF' }]}
                  resizeMode="contain"
                />
                <Text style={[styles.smartSortButtonText, { color: '#FFFFFF' }]}>Smart Sort</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

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
        contentContainerStyle={styles.listContent}
        data={emails}
        renderItem={({ item }) => (
          <EmailListItem
            email={item}
            onPress={() => handleOpenEmail(item.id)}
            onLongPress={() => handleLongPress(item.id)}
            isSelected={isMultiSelectMode && selectedEmails.includes(item.id)}
            onToggleRead={onToggleRead || (() => {})}
          />
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false} // Disable scrolling as parent ScrollView handles it
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

// Add displayName property
EmailList.displayName = 'EmailList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
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
    justifyContent: 'center',
    minWidth: 160,
  },
  smartSortButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    transform: [{ rotate: '-15deg' }],
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
}); 
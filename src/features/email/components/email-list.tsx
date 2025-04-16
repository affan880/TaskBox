import * as React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  StyleSheet 
} from 'react-native';
import { EmailListItem } from './email-list-item';
import { useTheme } from 'src/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../theme/theme';
import type { EmailData } from 'src/types/email';

// Only log in development mode
const DEBUG = __DEV__ && false; // Set to true to enable verbose logging

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
  onSmartSort = () => {},
  isAnalyzing = false,
}: EmailListProps) {
  const { colors } = useTheme();
  const [isListReady, setIsListReady] = React.useState(false);
  const flatListRef = React.useRef<FlatList>(null);
  const lastCategoryChangeTime = React.useRef<number>(Date.now());
  
  // Set list as ready after the first render is complete
  React.useEffect(() => {
    if (initialLoadComplete && emails.length > 0 && !isListReady) {
      // Use a smaller delay to ensure list is responsive
      const timer = setTimeout(() => {
        setIsListReady(true);
        if (DEBUG) console.log('[EmailList] List is now ready for load more');
      }, 300); // Reduced from 1000ms to 300ms
      
      return () => clearTimeout(timer);
    }
  }, [initialLoadComplete, emails.length, isListReady]);
  
  // Reset list ready state and track category change time when category changes
  React.useEffect(() => {
    setIsListReady(false);
    lastCategoryChangeTime.current = Date.now();
    if (DEBUG) console.log('[EmailList] Category changed, updating lastCategoryChangeTime');
  }, [selectedCategory]);

  // Debug log
  React.useEffect(() => {
    if (DEBUG) {
      console.log('[EmailList] Received emails:', emails?.length || 0);
      console.log('[EmailList] isLoading:', isLoading, 'initialLoadComplete:', initialLoadComplete);
    }
  }, [emails, isLoading, initialLoadComplete]);

  // Handle load more with debounce after category changes
  const handleLoadMoreWrapper = React.useCallback(() => {
    // Ignore load more requests within 500ms of a category change
    const timeSinceCategoryChange = Date.now() - lastCategoryChangeTime.current;
    const tooSoonAfterCategoryChange = timeSinceCategoryChange < 500;
    
    // Only block load more if we're already loading more or refreshing or too soon after category change
    if (isLoadingMore || refreshing || tooSoonAfterCategoryChange) {
      if (DEBUG) console.log('[EmailList] Ignoring load more, already loading or refreshing or category just changed', 
        { isLoadingMore, refreshing, timeSinceCategoryChange, tooSoonAfterCategoryChange });
      return;
    }
    
    if (DEBUG) console.log('[EmailList] Calling handleLoadMore');
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
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
          Loading emails...
        </Text>
      </View>
    );
  }

  // Debug output for when we're rendering the actual list
  if (DEBUG) console.log(`EmailList: Rendering FlatList with ${emails.length} emails`);
  
  return (
    <FlatList
      ref={flatListRef}
      contentContainerStyle={styles.listContent}
      data={emails}
      renderItem={({ item }) => {
        return (
          <EmailListItem
            email={item}
            onPress={() => handleOpenEmail(item.id)}
            onLongPress={() => handleLongPress(item.id)}
            isSelected={selectedEmails.includes(item.id)}
            isSelectMode={isMultiSelectMode}
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
        />
      }
      ListEmptyComponent={() => {
        if (selectedCategory !== "All" && !isLoading) {
          return (
            <View style={styles.emptyContainer}>
              <Icon name="filter_list" size={64} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                No emails in this category
              </Text>
              <TouchableOpacity 
                style={[styles.smartSortButton, { backgroundColor: colors.brand.primary }]}
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
            </View>
          );
        }
        
        return (
          <View style={styles.emptyContainer}>
            <Icon name="inbox" size={64} color={colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              {isLoading ? 'Loading emails...' : 'No emails found'}
            </Text>
            {initialLoadComplete && !isLoading && (
              <TouchableOpacity 
                style={[styles.refreshButton, { borderColor: colors.brand.primary }]}
                onPress={handleRefresh}
              >
                <Text style={{ color: colors.brand.primary }}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
      ListFooterComponent={renderFooter()}
      onEndReached={handleLoadMoreWrapper}
      onEndReachedThreshold={0.3} // More responsive value for end detection
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
}

// Add displayName property
EmailList.displayName = 'EmailList';

const styles = StyleSheet.create({
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
    marginTop: 100,
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
    marginTop: SPACING.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
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
}); 
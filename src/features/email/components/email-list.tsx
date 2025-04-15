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
};

export const EmailList = React.memo(({ 
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
}: EmailListProps) => {
  const { colors } = useTheme();

  // Debug log
  React.useEffect(() => {
    console.log('[EmailList] Received emails:', emails?.length || 0);
    console.log('[EmailList] isLoading:', isLoading, 'initialLoadComplete:', initialLoadComplete);
  }, [emails, isLoading, initialLoadComplete]);

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
    console.log('EmailList: Displaying loading indicator');
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
  console.log(`EmailList: Rendering FlatList with ${emails.length} emails`);
  
  return (
    <FlatList
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
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
});

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingTop: 130, // Increase to prevent header from hiding content
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
}); 
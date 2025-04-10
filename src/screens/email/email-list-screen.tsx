import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useTheme } from '../../theme/theme-context';
import { EmailListItem } from './components/email-list-item';
import { useEmailActions } from './hooks/use-email-actions';
import type { EmailData } from '../../types/email';

export function EmailListScreen() {
  const { colors } = useTheme();
  const { loadEmails, isLoading, resetEmailCache } = useEmailActions();
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Memoize the data for FlatList to prevent unnecessary re-renders
  const emailData = useMemo(() => emails, [emails]);

  const loadInitialEmails = useCallback(async () => {
    try {
      setError(null);
      const initialEmails = await loadEmails(1);
      setEmails(initialEmails);
      setPage(1);
      setHasMore(initialEmails.length > 0);
      setHasAttemptedLoad(true);
    } catch (err) {
      setError('Failed to load emails. Please try again.');
      console.error('Error loading initial emails:', err);
      setHasAttemptedLoad(true);
    }
  }, [loadEmails]);

  // Load emails on initial mount
  useEffect(() => {
    loadInitialEmails();
  }, [loadInitialEmails]);

  const handleRefresh = useCallback(async () => {
    if (isLoading) return;
    
    setIsRefreshing(true);
    try {
      // When refreshing, reset the email cache to fetch fresh data
      resetEmailCache();
      await loadInitialEmails();
    } finally {
      setIsRefreshing(false);
    }
  }, [isLoading, loadInitialEmails, resetEmailCache]);

  const loadMoreEmails = useCallback(async () => {
    // Prevent multiple simultaneous loading requests
    if (!hasMore || isLoading || isRefreshing) return;

    try {
      setError(null);
      const nextPage = page + 1;
      const newEmails = await loadEmails(nextPage);
      
      // If no new emails are returned, we've reached the end
      if (newEmails.length === 0) {
        setHasMore(false);
        return;
      }

      // Combine existing emails with new ones, removing any duplicates
      setEmails(prevEmails => {
        // Create a Set of existing email IDs for quick lookup
        const existingIds = new Set(prevEmails.map(email => email.id));
        
        // Filter out any duplicates from the new emails
        const uniqueNewEmails = newEmails.filter(email => !existingIds.has(email.id));
        
        // Return the combined list
        return [...prevEmails, ...uniqueNewEmails];
      });
      
      setPage(nextPage);
    } catch (err) {
      setError('Failed to load more emails. Please try again.');
      console.error('Error loading more emails:', err);
    }
  }, [hasMore, isLoading, isRefreshing, loadEmails, page]);

  const handleEmailPress = useCallback((email: EmailData) => {
    // In a production app, this would navigate to the email detail screen
    console.log('Email pressed:', email.id);
    // Navigate to email detail screen
    // navigation.navigate('EmailDetail', { emailId: email.id });
  }, []);

  const renderFooter = useCallback(() => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.status.error }]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.brand.primary }]}
            onPress={loadMoreEmails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    
    if (!isLoading || isRefreshing) return null;
    
    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={colors.brand.primary} />
      </View>
    );
  }, [isLoading, isRefreshing, error, colors, loadMoreEmails]);

  const renderEmptyComponent = useMemo(() => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.status.error }]}>{error}</Text>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: colors.brand.primary }]} 
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
          No emails found. Pull down to refresh.
        </Text>
      </View>
    );
  }, [isLoading, error, colors, handleRefresh]);

  const keyExtractor = useCallback((item: EmailData) => item.id, []);

  const renderItem = useCallback(({ item }: { item: EmailData }) => (
    <EmailListItem
      email={item}
      onPress={() => handleEmailPress(item)}
    />
  ), [handleEmailPress]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <FlatList
        data={emailData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={loadMoreEmails}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.brand.primary]}
            tintColor={colors.brand.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    marginBottom: 8,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
}); 
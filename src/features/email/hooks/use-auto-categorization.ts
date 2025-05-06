import { useState, useEffect, useRef, useCallback } from 'react';
import { EmailData } from 'src/types/email';
import { analyzeEmails } from '@/api/email-analysis-api';
import { AppState, AppStateStatus, Alert } from 'react-native';
import { getItemSync, setItemSync, getItem, setItem } from '@/lib/storage/storage';
import React from 'react';

// The storage key for cached categorized emails
const CATEGORIZED_EMAILS_CACHE_KEY = 'categorized_emails_cache';
const CATEGORY_COUNTS_CACHE_KEY = 'email_category_counts';
const LAST_ANALYSIS_TIME_KEY = 'last_email_analysis_time';

type CategorizedEmailsMap = Record<string, EmailData[]>;
type CategoryCounts = Record<string, number>;

interface AutoCategorizationOptions {
  enabled: boolean;
  pollingInterval?: number; // in milliseconds
  minimumTimeBetweenAnalysis?: number; // in milliseconds
  categories?: string[]; // available categories
}

interface AutoCategorizationResult {
  categorizedEmails: CategorizedEmailsMap | null;
  categoryCounts: CategoryCounts;
  apiRawResponse: Record<string, any[]> | null;
  isAnalyzing: boolean;
  lastAnalysisTime: number;
  processNewEmails: (allEmails: EmailData[]) => Promise<void>;
  processCategorizedEmails: (apiResponse: Record<string, any[]>, allEmails: EmailData[]) => CategorizedEmailsMap;
  forceAnalysis: () => Promise<void>;
  hasInitializedFromCache: boolean;
}

/**
 * Hook for automatic email categorization with caching
 * 
 * Monitors emails for changes and automatically categorizes them in the background,
 * storing results in persistent cache
 */
export function useAutoCategorization(
  emails: EmailData[],
  options: AutoCategorizationOptions
): AutoCategorizationResult {
  // Default options
  const {
    enabled = true,
    pollingInterval = 120000, // 2 minutes
    minimumTimeBetweenAnalysis = 300000, // 5 minutes
    categories = ['All', 'Work', 'Finance', 'Promotions', 'Social', 'Spam'], // Default categories
  } = options;

  // State for categorized emails
  const [categorizedEmails, setCategorizedEmails] = useState<CategorizedEmailsMap | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts>({});
  const [apiRawResponse, setApiRawResponse] = useState<Record<string, any[]> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasInitializedFromCache, setHasInitializedFromCache] = useState(false);
  
  // Refs for tracking state between renders
  const lastProcessedEmailIds = useRef<Set<string>>(new Set());
  const lastAnalysisTime = useRef<number>(0);
  const isAppActive = useRef<boolean>(true);
  const processingQueue = useRef<EmailData[]>([]);
  const isProcessingQueue = useRef<boolean>(false);

  // Ensure we have valid categories
  const validCategories = React.useMemo(() => {
    if (!categories || categories.length === 0) {
      return ['All', 'Work', 'Finance', 'Promotions', 'Social', 'Spam'];
    }
    return categories.filter(cat => cat && cat.trim() !== '');
  }, [categories]);

  // Initialize from cache
  useEffect(() => {
    const loadFromCache = async () => {
      try {
        // Try to load cached categorization data synchronously first
        const cachedCategorizedEmails = getItemSync<CategorizedEmailsMap | null>(
          CATEGORIZED_EMAILS_CACHE_KEY, 
          null
        );

        const cachedCounts = getItemSync<CategoryCounts>(
          CATEGORY_COUNTS_CACHE_KEY,
          {}
        );

        const cachedLastAnalysisTime = getItemSync<number>(
          LAST_ANALYSIS_TIME_KEY,
          0
        );

        // If we have cached data, use it immediately
        if (cachedCategorizedEmails) {
          setCategorizedEmails(cachedCategorizedEmails);
          setCategoryCounts(cachedCounts);
          lastAnalysisTime.current = cachedLastAnalysisTime;
          setHasInitializedFromCache(true);

          if (__DEV__) {
            console.log('[AutoCategorization] Loaded categorization data from cache');
            console.log('[AutoCategorization] Categories with counts:', 
              Object.entries(cachedCounts)
                .filter(([_, count]) => count > 0)
                .map(([cat, count]) => `${cat}: ${count}`)
                .join(', ')
            );
          }
        } else {
          // Try loading asynchronously as backup
          const asyncCachedEmails = await getItem<CategorizedEmailsMap | null>(
            CATEGORIZED_EMAILS_CACHE_KEY,
            null
          );

          if (asyncCachedEmails) {
            setCategorizedEmails(asyncCachedEmails);
            const asyncCounts = await getItem<CategoryCounts>(CATEGORY_COUNTS_CACHE_KEY, {});
            setCategoryCounts(asyncCounts || {});
            const asyncLastTime = await getItem<number>(LAST_ANALYSIS_TIME_KEY, 0);
            lastAnalysisTime.current = asyncLastTime || 0;
            setHasInitializedFromCache(true);
          }
        }
      } catch (error) {
        console.error('[AutoCategorization] Error loading from cache:', error);
      }
    };

    loadFromCache();
  }, []);

  /**
   * Process the API response to get full email objects by category
   */
  const processCategorizedEmails = useCallback((
    categorizedEmailsResponse: Record<string, any[]>,
    allEmails: EmailData[]
  ): CategorizedEmailsMap => {
    const DEBUG = __DEV__ && true;
    
    if (DEBUG) {
      console.log('[ProcessCategorized] Processing categories with:', Object.keys(categorizedEmailsResponse));
      console.log('[ProcessCategorized] Total emails available:', allEmails.length);
    }
    
    // Create a map of all emails with both id and threadId as keys for flexible lookup
    const emailMap = new Map<string, EmailData>();
    const threadMap = new Map<string, EmailData[]>();
    
    allEmails.forEach(email => {
      // Add to ID map
      emailMap.set(email.id, email);
      
      // Also map by threadId for fallback matching
      if (email.threadId) {
        if (!threadMap.has(email.threadId)) {
          threadMap.set(email.threadId, []);
        }
        threadMap.get(email.threadId)?.push(email);
      }
    });
    
    // Create a new object with the same categories but full email objects
    const processedCategories: CategorizedEmailsMap = {};
    const newCategoryCounts: CategoryCounts = {};
    
    // Process each category
    Object.keys(categorizedEmailsResponse).forEach(category => {
      // Normalize category name to match UI case (first letter uppercase, rest lowercase)
      const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      const emailsInCategory = categorizedEmailsResponse[category];
      
      if (DEBUG) {
        console.log(`[ProcessCategorized] Category ${normalizedCategory} has ${emailsInCategory.length} emails from API`);
      }
      
      // Map each email to full objects or create placeholders
      const fullEmails: EmailData[] = emailsInCategory
        .map(emailData => {
          // The backend might use messageId field
          const messageId = emailData.messageId || emailData.id;
          const threadId = emailData.threadId;
          
          // First try direct ID match
          let matchedEmail = messageId ? emailMap.get(messageId) : null;
          
          // If no match by ID, try matching by threadId
          if (!matchedEmail && threadId) {
            const threadsEmails = threadMap.get(threadId);
            if (threadsEmails && threadsEmails.length > 0) {
              matchedEmail = threadsEmails[0];
            }
          }
          
          // If still no match, create a new email object from the API data
          if (!matchedEmail) {
            // Parse date properly - EmailData expects a string
            let dateStr: string;
            try {
              dateStr = emailData.date || new Date().toISOString();
            } catch (e) {
              dateStr = new Date().toISOString();
            }
            
            // Create a new EmailData object from the API response
            matchedEmail = {
              id: messageId || `temp-${Date.now()}-${Math.random()}`,
              threadId: threadId || messageId || '',
              snippet: emailData.body?.substring(0, 100) || '',
              subject: emailData.subject || 'No subject',
              from: emailData.from || 'Unknown sender',
              to: emailData.to || '',
              date: dateStr,
              body: emailData.body || '',
              isUnread: emailData.labelIds?.includes('UNREAD') || false,
              hasAttachments: false,
              labelIds: emailData.labelIds || [],
              internalDate: dateStr,
              attachments: [],
            };
          }
          
          return matchedEmail;
        })
        .filter((email): email is EmailData => email !== null && email !== undefined);
      
      // Add the category with full email objects to the result
      processedCategories[normalizedCategory] = fullEmails;
      
      // Update category counts
      newCategoryCounts[normalizedCategory] = fullEmails.length;
      
      if (DEBUG) {
        console.log(`[ProcessCategorized] Category ${normalizedCategory} has ${fullEmails.length} processed emails`);
      }
    });
    
    // Make sure all configured categories have an entry, even if empty
    validCategories.forEach(category => {
      const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      if (!processedCategories[normalizedCategory]) {
        processedCategories[normalizedCategory] = [];
      }
      if (newCategoryCounts[normalizedCategory] === undefined) {
        newCategoryCounts[normalizedCategory] = 0;
      }
    });
    
    // Update the category counts state
    setCategoryCounts(newCategoryCounts);
    
    // Save category counts to cache
    setItemSync(CATEGORY_COUNTS_CACHE_KEY, newCategoryCounts);
    
    if (DEBUG) {
      console.log('[ProcessCategorized] Final category counts:', newCategoryCounts);
      console.log('[ProcessCategorized] Categories with emails:', Object.keys(processedCategories));
    }
    
    return processedCategories;
  }, [validCategories]);

  /**
   * Process emails in batches from the queue
   */
  const processEmailQueue = useCallback(async () => {
    // Skip if already processing, not enabled, or queue is empty
    if (isProcessingQueue.current || !enabled || processingQueue.current.length === 0) {
      return;
    }
    
    try {
      isProcessingQueue.current = true;
      
      // Only process if enough time has passed since last analysis
      const timeSinceLastAnalysis = Date.now() - lastAnalysisTime.current;
      if (timeSinceLastAnalysis < minimumTimeBetweenAnalysis) {
        return;
      }
      
      if (__DEV__) {
        console.log(`[AutoCategorization] Processing queue with ${processingQueue.current.length} emails`);
        console.log(`[AutoCategorization] Using categories:`, validCategories);
      }
      
      // Set analyzing state (but only if this is the first analysis or forcibly triggered)
      if (!categorizedEmails) {
        setIsAnalyzing(true);
      }
      
      // Call the API with minimal data to save bandwidth
      const minimalEmails = processingQueue.current.map(email => ({
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        snippet: email.snippet,
        from: email.from,
        to: email.to,
        date: email.date,
        labelIds: email.labelIds,
      }));
      
      // Clear the queue before API call to prevent duplicates
      processingQueue.current = [];
      
      // Perform the API call with valid categories
      const analysisResult = await analyzeEmails(
        undefined, // count
        undefined, // days
        undefined, // category
        validCategories // pass the validated categories array
      );
      
      // Update last analysis time
      const currentTime = Date.now();
      lastAnalysisTime.current = currentTime;
      await setItem(LAST_ANALYSIS_TIME_KEY, currentTime);
      
      // Check if we have categorized emails in the response
      if (analysisResult.categorizedEmails) {
        // Store raw API response
        setApiRawResponse(analysisResult.categorizedEmails);
        
        // Process the response to get full email objects
        const processedCategories = processCategorizedEmails(
          analysisResult.categorizedEmails, 
          emails
        );
        
        // Update categorized emails state
        setCategorizedEmails(processedCategories);
        
        // Cache the results for future use
        await setItem(CATEGORIZED_EMAILS_CACHE_KEY, processedCategories);
        
        if (__DEV__) {
          console.log('[AutoCategorization] Categorization complete, results cached');
        }
      }
      
    } catch (error) {
      console.error('[AutoCategorization] Error during queue processing:', error);
    } finally {
      setIsAnalyzing(false);
      isProcessingQueue.current = false;
    }
  }, [categorizedEmails, emails, enabled, minimumTimeBetweenAnalysis, processCategorizedEmails, validCategories]);

  /**
   * Queue emails for processing and schedule a background job
   */
  const queueEmailsForProcessing = useCallback((newEmails: EmailData[]) => {
    // Add new unique emails to the queue
    const existingIds = new Set(processingQueue.current.map(e => e.id));
    const uniqueNewEmails = newEmails.filter(email => !existingIds.has(email.id));
    
    if (uniqueNewEmails.length > 0) {
      processingQueue.current = [...processingQueue.current, ...uniqueNewEmails];
      
      if (__DEV__) {
        console.log(`[AutoCategorization] Queued ${uniqueNewEmails.length} new emails for processing`);
      }
      
      // Try to process the queue immediately if conditions allow
      processEmailQueue();
    }
  }, [processEmailQueue]);

  /**
   * Check for new emails and queue them for categorization
   */
  const processNewEmails = useCallback(async (allEmails: EmailData[]) => {
    // Skip if not enabled, app is in background, or no emails
    if (!enabled || !isAppActive.current || allEmails.length === 0) {
      return;
    }
    
    // Initialize last processed emails if empty
    if (lastProcessedEmailIds.current.size === 0) {
      const currentEmailIds = new Set(allEmails.map(email => email.id));
      lastProcessedEmailIds.current = currentEmailIds;
      return;
    }
    
    // Find new emails by comparing with previously processed IDs
    const newEmails = allEmails.filter(email => !lastProcessedEmailIds.current.has(email.id));
    
    if (newEmails.length > 0) {
      if (__DEV__) {
        console.log(`[AutoCategorization] Found ${newEmails.length} new emails to queue`);
      }
      
      // Queue the new emails for processing
      queueEmailsForProcessing(newEmails);
      
      // Update the set of processed email IDs
      const currentEmailIds = new Set(allEmails.map(email => email.id));
      lastProcessedEmailIds.current = currentEmailIds;
    }
  }, [enabled, queueEmailsForProcessing]);

  /**
   * Force an immediate analysis regardless of timing
   */
  const forceAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    
    try {
      setIsAnalyzing(true);
      
      if (__DEV__) {
        console.log('[AutoCategorization] Forced analysis started');
        console.log('[AutoCategorization] Using categories:', validCategories);
      }
      
      // Call the API with valid categories
      const analysisResult = await analyzeEmails(
        undefined, // count
        undefined, // days
        undefined, // category
        validCategories // pass the validated categories array
      );
      
      // Update last analysis time
      const currentTime = Date.now();
      lastAnalysisTime.current = currentTime;
      await setItem(LAST_ANALYSIS_TIME_KEY, currentTime);
      
      // Check if we have categorized emails
      if (analysisResult.categorizedEmails) {
        // Store raw API response
        setApiRawResponse(analysisResult.categorizedEmails);
        
        // Process the response
        const processedCategories = processCategorizedEmails(
          analysisResult.categorizedEmails, 
          emails
        );
        
        // Update categorized emails state
        setCategorizedEmails(processedCategories);
        
        // Cache the results
        await setItem(CATEGORIZED_EMAILS_CACHE_KEY, processedCategories);
        
        if (__DEV__) console.log('[AutoCategorization] Forced analysis complete');
      }
    } catch (error) {
      console.error('[AutoCategorization] Error during forced analysis:', error);
      Alert.alert(
        'Analysis Error',
        'There was a problem analyzing your emails. Please try again later.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [emails, isAnalyzing, processCategorizedEmails, validCategories]);

  // Initial setup effect - process emails on first load if no cache
  useEffect(() => {
    if (enabled && emails.length > 0 && !hasInitializedFromCache) {
      processNewEmails(emails);
    }
  }, [enabled, emails, hasInitializedFromCache, processNewEmails]);

  // Set up app state listener for React Native
  useEffect(() => {
    // Function to handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isAppActive.current) {
        // App has come to the foreground
        isAppActive.current = true;
        
        // Process any queued emails when app becomes active
        if (enabled && processingQueue.current.length > 0) {
          processEmailQueue();
        } else if (enabled && emails.length > 0) {
          // Check for any new emails that arrived while app was inactive
          processNewEmails(emails);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        isAppActive.current = false;
      }
    };

    // Set up AppState listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Clean up function
    return () => {
      subscription.remove();
    };
  }, [enabled, emails, processEmailQueue, processNewEmails]);

  // Set up polling interval for the queue
  useEffect(() => {
    // Skip if disabled
    if (!enabled) return;
    
    // Create interval
    const intervalId = setInterval(() => {
      // Only process if app is active and we have queued emails
      if (isAppActive.current && processingQueue.current.length > 0) {
        processEmailQueue();
      }
    }, pollingInterval);
    
    // Clean up
    return () => clearInterval(intervalId);
  }, [enabled, pollingInterval, processEmailQueue]);

  // Monitor emails for changes
  useEffect(() => {
    if (enabled && emails.length > 0 && isAppActive.current) {
      processNewEmails(emails);
    }
  }, [enabled, emails, processNewEmails]);

  return {
    categorizedEmails,
    categoryCounts,
    apiRawResponse,
    isAnalyzing,
    lastAnalysisTime: lastAnalysisTime.current,
    processNewEmails,
    processCategorizedEmails,
    forceAnalysis,
    hasInitializedFromCache,
  };
} 
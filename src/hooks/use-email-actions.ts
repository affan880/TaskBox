import React, { useState, useCallback, useReducer, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import RNBlobUtil from 'react-native-blob-util';
import FileViewer from 'react-native-file-viewer';
import { useGmail } from './use-gmail'; // Assuming use-gmail hook is in the same folder
import type { FetchedAttachmentData } from './use-gmail'; // Import the type

// --- State Definition ---
type EmailActionState = {
  isLoading: boolean;
  error: string | null;
  downloadProgress: Record<string, number>; // attachmentId -> progress (0-100)
};

// --- Action Definitions ---
type FetchAttachmentPayload = {
  emailId: string;
  attachmentId: string;
  filename: string;
  mimeType: string;
};

type UpdateDownloadProgressPayload = {
  attachmentId: string;
  progress: number; // 0-100, or -1 for error
};

// Action type for triggering the fetch/download process from the UI
export type FetchAttachmentActionTrigger = {
    type: 'FETCH_ATTACHMENT'; // Use a distinct type for triggering
    payload: FetchAttachmentPayload;
}

// Internal action types used by the hook/reducer
type EmailAction = 
  | FetchAttachmentActionTrigger // Include the trigger type
  | { type: 'FETCH_ATTACHMENT_START'; payload: { attachmentId: string } } 
  | { type: 'FETCH_ATTACHMENT_SUCCESS'; payload: { attachmentId: string } }
  | { type: 'FETCH_ATTACHMENT_ERROR'; payload: { attachmentId: string; error: string } }
  | { type: 'UPDATE_DOWNLOAD_PROGRESS'; payload: UpdateDownloadProgressPayload }
  | { type: 'DOWNLOAD_COMPLETE'; payload: { attachmentId: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// --- Initial State ---
const initialState: EmailActionState = {
  isLoading: false,
  error: null,
  downloadProgress: {},
};

// --- Reducer Function ---
function emailActionReducer(state: EmailActionState, action: EmailAction): EmailActionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      // Avoid clearing progress on general errors if not desired
      return { ...state, isLoading: false, error: action.payload }; 
    case 'FETCH_ATTACHMENT_START': // Internal state update when fetch begins
      return { 
          ...state, 
          isLoading: true, // Consider a more granular loading state if needed
          error: null, 
          downloadProgress: { ...state.downloadProgress, [action.payload.attachmentId]: 0 } 
      };
    case 'FETCH_ATTACHMENT_SUCCESS': // Internal state update on successful API fetch
      return { 
          ...state, 
          // isLoading: false, // Keep true until download completes?
          // downloadProgress remains 0 until handleDownload updates it
      };
    case 'FETCH_ATTACHMENT_ERROR': // Internal state update on fetch API error
       return { 
           ...state, 
           isLoading: false, 
           error: action.payload.error, 
           downloadProgress: { ...state.downloadProgress, [action.payload.attachmentId]: -1 } // Indicate error
       };
    case 'UPDATE_DOWNLOAD_PROGRESS': // Update progress during download
      return {
        ...state,
        // Only update progress, don't change isLoading here
        downloadProgress: {
          ...state.downloadProgress,
          [action.payload.attachmentId]: action.payload.progress,
        },
      };
     case 'DOWNLOAD_COMPLETE': // Update state when download finishes (success or fail handled by progress)
        // Check final progress state to see if successful (100) or error (-1)
        const finalProgress = state.downloadProgress[action.payload.attachmentId];
        return { 
           ...state,
           isLoading: false, // Fetch/download process is complete
           error: finalProgress === -1 ? (state.error || 'Download failed') : null, // Keep error if progress is -1
           // Progress is already set by UPDATE_DOWNLOAD_PROGRESS
       };

    default:
      // If FETCH_ATTACHMENT trigger is received, reducer doesn't handle it directly
      // It's caught by the custom dispatchAction logic below.
      // Ensure exhaustive check or default return:
      // const _exhaustiveCheck: never = action;
      return state;
  }
}

// --- The Hook ---
export function useEmailActions() {
  const [state, dispatch] = useReducer(emailActionReducer, initialState);
  const gmail = useGmail(); // Get Gmail API functions

  // --- Download Logic ---
  const handleDownload = useCallback(async (attachmentData: FetchedAttachmentData, attachmentId: string) => {
    // No need to dispatch FETCH_ATTACHMENT_START here, already done by dispatchAction
    if (!attachmentData?.data) {
      Alert.alert('Error', 'No attachment data found to download.');
      dispatch({ type: 'UPDATE_DOWNLOAD_PROGRESS', payload: { attachmentId, progress: -1 } });
      dispatch({ type: 'DOWNLOAD_COMPLETE', payload: { attachmentId } }); // Signal completion (failure)
      return;
    }

    const { filename, mimeType, data } = attachmentData;
    const dirs = RNBlobUtil.fs.dirs;
    
    // Ensure safe filename by removing any problematic characters
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Create a dedicated attachments directory inside DocumentDir for iOS
    const attachmentsDir = Platform.OS === 'ios' 
      ? `${dirs.DocumentDir}/attachments`
      : dirs.DownloadDir;
      
    try {
      // Ensure attachments directory exists on iOS
      if (Platform.OS === 'ios') {
        const dirExists = await RNBlobUtil.fs.exists(attachmentsDir);
        if (!dirExists) {
          await RNBlobUtil.fs.mkdir(attachmentsDir);
          console.log('[useEmailActions] Created attachments directory');
        }
      }
      
      const path = `${attachmentsDir}/${safeFilename}`;
      console.log(`[useEmailActions] Writing attachment to: ${path}`);
      
      // Start download progress
      dispatch({ type: 'UPDATE_DOWNLOAD_PROGRESS', payload: { attachmentId, progress: 50 } }); 
      
      // Write file with explicit encoding
      await RNBlobUtil.fs.writeFile(path, data, 'base64');
      console.log(`[useEmailActions] File written successfully: ${safeFilename}`);
      dispatch({ type: 'UPDATE_DOWNLOAD_PROGRESS', payload: { attachmentId, progress: 100 } });
      dispatch({ type: 'DOWNLOAD_COMPLETE', payload: { attachmentId } }); // Signal completion (success)

      // Ask user to open the file
      Alert.alert(
        'Download Complete',
        `Attachment "${filename}" saved. Open it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: () => {
              FileViewer.open(path, { showOpenWithDialog: true })
                .catch((error) => {
                  console.error(`[useEmailActions] Error opening file ${filename}:`, error);
                  Alert.alert('Error', 'Could not open the file. You may need a specific app to view this file type.');
                });
            },
          },
        ]
      );
    } catch (error) {
      console.error(`[useEmailActions] Error saving file ${filename}:`, error);
      Alert.alert('Download Error', `Failed to save attachment: ${filename}`);
      dispatch({ type: 'UPDATE_DOWNLOAD_PROGRESS', payload: { attachmentId, progress: -1 } });
      dispatch({ type: 'DOWNLOAD_COMPLETE', payload: { attachmentId } }); // Signal completion (failure)
    }
  }, []); // Dependencies: none for this handler

  // --- Custom Action Dispatcher --- 
  // This intercepts the FETCH_ATTACHMENT action trigger from the UI
  const dispatchAction = useCallback(async (action: EmailAction | FetchAttachmentActionTrigger) => {
     // Check if it's the action trigger we want to handle async
     if (action.type === 'FETCH_ATTACHMENT') { 
        const { attachmentId, emailId, filename, mimeType } = action.payload;
        
        // Prevent re-fetching if already in progress or completed/failed
        if (state.downloadProgress[attachmentId] !== undefined && state.downloadProgress[attachmentId] !== -1) {
            console.log(`[useEmailActions] Download for ${filename} already in progress or completed.`);
            return; 
        }
        
        // Dispatch START to update UI (show progress indicator at 0%)
        dispatch({ type: 'FETCH_ATTACHMENT_START', payload: { attachmentId } }); 
        
        try {
          console.log(`[useEmailActions] Fetching attachment data: ${filename} (ID: ${attachmentId})`);
          // Do not modify the attachmentId - pass it directly to the Gmail API
          const fetchedData = await gmail.fetchAttachment(
            attachmentId,
            emailId,
            filename,
            mimeType
          );

          if (fetchedData) {
             console.log(`[useEmailActions] Attachment data fetched successfully: ${filename}. Starting download/save...`);
             dispatch({ type: 'FETCH_ATTACHMENT_SUCCESS', payload: { attachmentId } });
             // Trigger the actual download/save process
             await handleDownload(fetchedData, attachmentId);
          } else {
            // fetchAttachment returned null (it should have shown an Alert already)
             console.warn(`[useEmailActions] gmail.fetchAttachment returned null for ${filename}.`);
             // Reducer already set progress to -1 via FETCH_ATTACHMENT_ERROR from fetchAttachment
             dispatch({ type: 'FETCH_ATTACHMENT_ERROR', payload: { attachmentId, error: 'Failed by gmail.fetchAttachment' }});
             dispatch({ type: 'DOWNLOAD_COMPLETE', payload: { attachmentId } }); // Signal completion (failure)
          }

        } catch (error: any) {
           console.error(`[useEmailActions] Error during FETCH_ATTACHMENT action for ${filename}:`, error);
           Alert.alert('Fetch Error', `Could not fetch attachment: ${error.message || 'Unknown error'}`);
           dispatch({ type: 'FETCH_ATTACHMENT_ERROR', payload: { attachmentId, error: error.message || 'Unknown fetch error' } });
           dispatch({ type: 'DOWNLOAD_COMPLETE', payload: { attachmentId } }); // Signal completion (failure)
        }
     } else {
        // For all other standard actions, just pass them to the reducer
        dispatch(action as EmailAction); // Type assertion might be needed if types overlap significantly
     }

  }, [gmail, handleDownload, state.downloadProgress]); // Dependencies: gmail API, download handler, and progress state


  // --- Return State and Dispatcher --- 
  return {
    isLoading: state.isLoading,
    error: state.error,
    downloadProgress: state.downloadProgress,
    dispatchAction, // Expose the custom dispatcher
  };
}

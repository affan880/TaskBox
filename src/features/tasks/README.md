# TaskBox Task Attachment System

This document provides an overview of how file attachments are handled within the TaskBox application.

## Components and Utilities

### `task-attachment-utils.tsx`

Central utility file that contains reusable functions and hooks for working with task attachments:

- `formatFileSize`: Converts byte sizes to human-readable formats
- `getFileIcon`: Returns the appropriate icon name based on file MIME type
- `openFile`: Opens a file using the device's default viewer
- `useTaskAttachments`: Custom hook that manages attachment state, uploads, and downloads

### `task-attachment-downloader.tsx`

Component used to display and download individual attachments:
- Renders file information (name, size, type)
- Provides download functionality with progress indication
- Allows opening downloaded files

### `task-attachments-viewer.tsx`

Component to display a list of attachments:
- Shows a collapsible list of attachments with "Show More/Less" functionality
- Uses TaskAttachmentDownloader for individual attachments

## Implementation Details

### Uploading Process

1. Files are selected using `DocumentPicker` from `@react-native-documents/picker`
2. A temporary attachment is created in state with `isUploading: true`
3. Files are uploaded to Firebase Storage with progress tracking
4. Once upload completes, the attachment is updated with the download URL

### File Storage

Files are stored in Firebase Storage with the following path structure:
```
tasks/attachments/{attachmentId}/{filename}
```

### Downloading Process

1. Files are downloaded using `RNBlobUtil` (react-native-blob-util)
2. Downloads are saved to appropriate directories based on the platform:
   - iOS: `{DocumentDir}/TaskBox/Attachments/`
   - Android: `{DownloadDir}/TaskBox/`
3. Download progress is tracked and displayed to the user
4. Downloaded files can be opened with the device's default file viewer

## Error Handling

- Upload failures remove the temporary attachment and show an alert
- Download failures show an alert with the error message
- File opening errors are caught and appropriate messages are displayed

## Integration Points

- `TaskFormModal`: Uses the `useTaskAttachments` hook for adding/removing attachments during task creation/editing
- `TaskDetailModal`: Displays attachments using `TaskAttachmentsViewer`

## Type Definitions

Attachments follow the `TaskAttachment` type defined in `src/types/task.ts`:

```typescript
export type TaskAttachment = {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  createdAt: string;
  downloadUrl?: string;
  isUploading?: boolean;
};
``` 
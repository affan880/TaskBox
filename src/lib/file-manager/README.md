# File Management in Plexar

This directory contains utilities for file operations in the Plexar app, including downloading, uploading, and managing files.

## Components

### `download-manager.ts`

Core utility file with functions for file operations:

- `downloadFile`: Downloads a file from a URL to local storage
- `openFile`: Opens a downloaded file with the device's default viewer
- `downloadAndOpenFile`: Combines download and open functionality with user prompts
- `deleteDownloadedFile`: Removes a file from local storage
- `uploadFile`: Uploads a file to a server URL
- `checkFileExists`: Checks if a file already exists in the download directory

### `use-file-manager.ts`

React hook that provides an easy-to-use interface to the file management utilities:

- Tracks download/upload progress
- Manages loading states
- Handles errors gracefully
- Provides type-safe function wrappers

## Usage

### Basic File Download

```tsx
import { useFileManager } from '@/lib/file-manager/use-file-manager';

function DownloadExample() {
  const { download, progress, isLoading, error } = useFileManager();
  
  const handleDownload = async () => {
    try {
      const filePath = await download({
        url: 'https://example.com/file.pdf',
        filename: 'document.pdf',
        mimeType: 'application/pdf'
      });
      
      console.log('File downloaded to:', filePath);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };
  
  return (
    <View>
      <Button title="Download File" onPress={handleDownload} disabled={isLoading} />
      {isLoading && <Text>Downloading: {progress}%</Text>}
      {error && <Text>Error: {error}</Text>}
    </View>
  );
}
```

### Download and Open

```tsx
import { useFileManager } from '@/lib/file-manager/use-file-manager';

function DownloadAndOpenExample() {
  const { downloadAndOpen } = useFileManager();
  
  const handleDownloadAndOpen = async () => {
    try {
      await downloadAndOpen({
        url: 'https://example.com/file.pdf',
        filename: 'document.pdf',
        mimeType: 'application/pdf'
      });
    } catch (error) {
      console.error('Operation failed:', error);
    }
  };
  
  return <Button title="Download & Open" onPress={handleDownloadAndOpen} />;
}
```

### File Upload

```tsx
import { useFileManager } from '@/lib/file-manager/use-file-manager';

function UploadExample() {
  const { upload, progress, isLoading } = useFileManager();
  
  const handleUpload = async (filePath: string) => {
    try {
      const response = await upload(
        filePath,
        'https://api.example.com/upload',
        'file',
        { userId: '123' }, // Additional form data
        { Authorization: 'Bearer token' } // Headers
      );
      
      console.log('Upload successful:', response);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
  
  return (
    <View>
      <Button title="Upload File" onPress={() => handleUpload('/path/to/file.jpg')} />
      {isLoading && <Text>Uploading: {progress}%</Text>}
    </View>
  );
}
```

## Platform-Specific Storage

The utilities handle platform differences automatically:

- iOS: Files are stored in `{DocumentDir}/Plexar/Downloads/`
- Android: Files are saved to `{DownloadDir}/Plexar/`

## Error Handling

All utilities include proper error handling and will:

- Return informative error messages
- Update the `error` state in the hook
- Log errors to the console for debugging
- Show appropriate alerts to users when necessary 
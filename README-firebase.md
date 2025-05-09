# Plexar: React Native CLI + Firebase Integration

A task management application built with React Native CLI and Firebase, showcasing authentication, Firestore database operations, and storage functionality.

## Tech Stack

- **React Native** - Mobile framework
- **TypeScript** - Type safety
- **Firebase** - Backend services
  - Authentication
  - Firestore
  - Storage
- **Zustand** - State management
- **React Navigation** - Routing and navigation

## Project Structure

```
src
  ├── components      # UI components
  │   └── ui          # Reusable UI elements
  ├── config          # Firebase configuration
  ├── hooks           # Custom hooks
  ├── navigation      # Navigation setup
  ├── screens         # App screens
  │   └── auth        # Authentication screens
  ├── store           # Zustand state management
  ├── types           # TypeScript definitions
  └── utils           # Utility functions
```

## Installation

1. Clone the repo:
   ```bash
   git clone [your-repo-url]
   cd Plexar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Add an iOS app and/or Android app to your Firebase project
   - Download config files:
     - iOS: GoogleService-Info.plist → place in `ios/Plexar/`
     - Android: google-services.json → place in `android/app/`
   - Enable Authentication, Firestore, and Storage in Firebase Console

4. Configure Android project:
   - Ensure `android/build.gradle` has Google Services plugin:
     ```groovy
     buildscript {
       dependencies {
         // ... other dependencies
         classpath 'com.google.gms:google-services:4.4.2'
       }
     }
     ```
   - Ensure `android/app/build.gradle` applies the plugin:
     ```groovy
     apply plugin: 'com.android.application'
     apply plugin: 'com.google.gms.google-services'
     ```

5. Install pods for iOS:
   ```bash
   cd ios && pod install && cd ..
   ```

## Running the App

```bash
# Start Metro Bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Firebase Setup Details

### Authentication

This app uses Firebase Email/Password authentication. To enable it:

1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Email/Password provider

The app includes:
- Sign in screen
- Sign up screen
- Password reset functionality

### Firestore

The app uses Firestore for storing tasks. Create a Firestore database:

1. Go to Firebase Console → Firestore Database
2. Click "Create database"
3. Choose start mode (test mode or production mode)

Default security rules (for development only):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Storage

The app supports file uploads using Firebase Storage:

1. Go to Firebase Console → Storage
2. Click "Get started"
3. Choose start mode (test mode or production mode)

## Key Components

### Firebase Configuration

The Firebase configuration is in `src/config/firebase.ts`. The React Native Firebase modules are automatically initialized when imported.

### Auth Store (Zustand)

The authentication state is managed in `src/store/auth-store.ts` using Zustand.

### Firestore Hook

The `useCollection` hook in `src/hooks/use-firestore.ts` provides a simple interface for Firestore CRUD operations.

### Storage Hook

The `useStorage` hook in `src/hooks/use-storage.ts` handles file uploads and downloads.

## Testing Firebase Integration

1. **Authentication**: 
   - Create a new account using the Sign Up screen
   - Sign in with the created account
   - Try the password reset functionality

2. **Firestore**:
   - Create, update, and delete tasks
   - Observe real-time updates when data changes

3. **Storage**:
   - Upload files through the app 
   - Verify they appear in Firebase Storage

## Troubleshooting

- **Firebase Initialization Issues**: 
  - Check that config files are in the correct locations
  - Ensure bundle IDs and package names match Firebase configuration

- **Authentication Errors**:
  - Verify Email/Password provider is enabled in Firebase Console
  - Check for correct email format and password length

- **Firestore/Storage Errors**:
  - Verify security rules allow access
  - Check user authentication status

## License

[MIT License](LICENSE)

---

This project follows best practices for React Native and Firebase integration, with a focus on:
- Type safety with TypeScript
- Modular component architecture
- Custom hooks for Firebase services
- Clean separation of concerns 
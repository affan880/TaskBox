import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

/**
 * Firebase Integration Steps:
 * 
 * 1. Create a Firebase project in the Firebase Console (https://console.firebase.google.com/)
 * 
 * 2. Register your app:
 *   a. Go to Project Settings > Add App (iOS and/or Android)
 *   b. For iOS: Enter your Bundle ID (found in Xcode > General tab)
 *   c. For Android: Enter your package name (found in android/app/build.gradle or AndroidManifest.xml)
 * 
 * 3. Download config files:
 *   a. iOS: Download GoogleService-Info.plist and place it in ios/[YourAppName]/
 *   b. Android: Download google-services.json and place it in android/app/
 * 
 * 4. Configure your Android project:
 *   a. Modify android/build.gradle to add google-services plugin:
 *      buildscript {
 *        dependencies {
 *          // ... other dependencies
 *          classpath 'com.google.gms:google-services:4.4.2'
 *        }
 *      }
 * 
 *   b. Modify android/app/build.gradle to apply the plugin:
 *      apply plugin: 'com.android.application'
 *      apply plugin: 'com.google.gms.google-services'
 * 
 * 5. Enable the services you need in Firebase Console:
 *   a. Authentication: Set up sign-in methods
 *   b. Firestore: Create database
 *   c. Storage: Set up storage rules
 * 
 * For more information, visit: https://rnfirebase.io/
 */

// Firebase app instance
const app = firebase.app();

// Export Firebase services
export { auth, firestore, storage };

// Initialize Firebase
export const initializeFirebase = () => {
  try {
    // Log that Firebase services are ready
    console.log('Firebase App initialized:', app.name);
    console.log('Firebase Authentication ready');
    console.log('Firebase Firestore ready');
    console.log('Firebase Storage ready');
    return app;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}; 
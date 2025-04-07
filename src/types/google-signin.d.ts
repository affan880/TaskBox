import '@react-native-google-signin/google-signin';

// This declaration file extends the existing GoogleSignin type definitions
// to include methods that exist in the implementation but are missing from the type definitions
declare module '@react-native-google-signin/google-signin' {
  export interface GoogleSigninStatic {
    // Add the missing isSignedIn method
    isSignedIn(): Promise<boolean>;
  }
}
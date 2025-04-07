import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { FIREBASE_WEB_CLIENT_ID, FIREBASE_IOS_CLIENT_ID } from '@env';
import { revokeGmailAccess } from '../utils/gmail-api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type AuthState = {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  error: string | null;
  hasCheckedAuth: boolean;
  initialized: boolean;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuthListener: () => () => void;
  checkAndRestoreSession: () => Promise<boolean>;
};

// Token cache key
const AUTH_TOKENS_KEY = 'auth_tokens';

// Initialize Google Sign-in configuration
const configureGoogleSignin = () => {
  console.log('Configuring GoogleSignin with the following client IDs:',
    { webClientId: FIREBASE_WEB_CLIENT_ID ? 'present' : 'missing', 
      iosClientId: FIREBASE_IOS_CLIENT_ID ? 'present' : 'missing' });
      
  if (Platform.OS === 'android') {
    // For Android, use the server_client_id from strings.xml directly
    GoogleSignin.configure({
      // Android will automatically use the 'default_web_client_id' from resources
      webClientId: FIREBASE_WEB_CLIENT_ID, // Explicitly provide the ID
      iosClientId: FIREBASE_IOS_CLIENT_ID,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',   
        'https://www.googleapis.com/auth/gmail.modify',
        'profile',
        'email',
        'openid'
      ],
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  } else {
    // For iOS, use the client IDs from env
    GoogleSignin.configure({
      webClientId: FIREBASE_WEB_CLIENT_ID,
      iosClientId: FIREBASE_IOS_CLIENT_ID,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',  
        'https://www.googleapis.com/auth/gmail.modify',
        'profile',
        'email',
        'openid'
      ],
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }
};

// Helper for debugging Google Sign-In state
const debugGoogleSignIn = async () => {
  try {
    console.log('Debugging GoogleSignin state...');
    
    try {
      const isSignedIn = await (GoogleSignin as any).isSignedIn();
      console.log('GoogleSignin.isSignedIn():', isSignedIn);
    } catch (e) {
      console.log('Error checking isSignedIn:', e);
    }
    
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      console.log('GoogleSignin.getCurrentUser():', currentUser ? 'User exists' : 'No user');
    } catch (e) {
      console.log('Error getting current user:', e);
    }
    
    try {
      const tokens = await GoogleSignin.getTokens();
      console.log('GoogleSignin.getTokens():', tokens ? 'Tokens available' : 'No tokens');
    } catch (e) {
      console.log('Error getting tokens:', e);
    }
    
  } catch (e) {
    console.log('Overall error in debugGoogleSignIn:', e);
  }
};
``
// Configure Google SignIn immediately
console.log('Initial GoogleSignin configuration');
configureGoogleSignin();

// Create the store
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true, // Start with loading true to prevent flickering
  error: null,
  hasCheckedAuth: false,
  initialized: false,

  setUser: (user) => {
    // Only update if the user value has changed
    if (JSON.stringify(get().user) !== JSON.stringify(user)) {
      set({ user });
    }
  },

  initializeAuthListener: () => {
    // Set up the auth listener
    const firebaseAuth = auth();
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      // Only update if the user value has changed
      if (JSON.stringify(get().user) !== JSON.stringify(user)) {
        set({ user, hasCheckedAuth: true, isLoading: false, initialized: true });
      }
    });

    // Ensure Google SignIn is configured and then trigger session check
    configureGoogleSignin();
    get().checkAndRestoreSession();

    // Return the cleanup function
    return unsubscribe;
  },

  // Check if we have cached tokens and try to restore the session
  checkAndRestoreSession: async () => {
    try {
      console.log('Starting checkAndRestoreSession');
      set({ isLoading: true });

      // First check if Firebase already has active user
      const currentUser = auth().currentUser;
      if (currentUser) {
        console.log('Firebase already has active user, skipping restoration');
        set({ user: currentUser, hasCheckedAuth: true, isLoading: false, initialized: true });
        return true;
      }

      // Make sure GoogleSignin is configured
      console.log('No active Firebase user, configuring GoogleSignin');
      configureGoogleSignin();
      await debugGoogleSignIn();

      try {
        // Try to restore from Google Sign-in
        console.log('Checking if user is signed in with Google');
        const isSignedIn = await (GoogleSignin as any).isSignedIn();
        console.log('GoogleSignin.isSignedIn() result:', isSignedIn);
        
        if (isSignedIn) {
          console.log('User is signed in with Google, attempting to get tokens');
          try {
            // User is signed in to Google, get tokens
            const { accessToken, idToken } = await GoogleSignin.getTokens();
            console.log('Tokens retrieved:', { 
              hasAccessToken: !!accessToken, 
              hasIdToken: !!idToken 
            });
            
            if (!idToken) {
              throw new Error('No ID token present');
            }

            // Store tokens for future use
            await AsyncStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify({ accessToken, idToken }));
            console.log('Tokens stored in AsyncStorage');

            // Create a Google credential with the token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken, accessToken);

            // Sign-in the user with the credential
            console.log('Signing in with Firebase using Google credential');
            const userCredential = await auth().signInWithCredential(googleCredential);
            console.log('Firebase sign-in successful');
            set({ user: userCredential.user, hasCheckedAuth: true, isLoading: false, initialized: true });
            return true;
          } catch (error) {
            console.log('Error restoring from Google Sign-in:', error);
            // If there's an error, try to sign in silently
            try {
              console.log('Attempting silent sign-in as fallback');
              const userInfo = await GoogleSignin.signInSilently();
              console.log('Silent sign-in result:', userInfo ? 'successful' : 'failed');
              
              if (userInfo && userInfo.type === 'success' && userInfo.data) {
                console.log('Getting tokens after silent sign-in');
                const { accessToken, idToken } = await GoogleSignin.getTokens();
                if (idToken) {
                  console.log('Creating Google credential from silent sign-in tokens');
                  const googleCredential = auth.GoogleAuthProvider.credential(idToken, accessToken);
                  console.log('Signing in with Firebase');
                  const userCredential = await auth().signInWithCredential(googleCredential);
                  console.log('Firebase sign-in successful after silent sign-in');
                  set({ user: userCredential.user, hasCheckedAuth: true, isLoading: false, initialized: true });
                  return true;
                }
              }
            } catch (silentError) {
              console.log('Silent sign-in failed:', silentError);
            }
          }
        }
      } catch (googleSignInError) {
        console.error('GoogleSignin error:', googleSignInError);
      }

      // Try to restore from cached tokens
      console.log('Attempting to restore from cached tokens');
      const tokenData = await AsyncStorage.getItem(AUTH_TOKENS_KEY);
      if (tokenData) {
        console.log('Found cached tokens in AsyncStorage');
        try {
          const { accessToken, idToken } = JSON.parse(tokenData);
          console.log('Parsed token data:', {
            hasAccessToken: !!accessToken,
            hasIdToken: !!idToken
          });
          
          if (idToken) {
            try {
              // Create a Google credential with the token
              console.log('Creating Google credential from cached tokens');
              const googleCredential = auth.GoogleAuthProvider.credential(idToken, accessToken);
              
              // Sign-in the user with the credential
              console.log('Signing in with Firebase using cached tokens');
              const userCredential = await auth().signInWithCredential(googleCredential);
              console.log('Firebase sign-in successful using cached tokens');
              set({ user: userCredential.user, hasCheckedAuth: true, isLoading: false, initialized: true });
              return true;
            } catch (tokenError) {
              // Token might be expired, clear it
              console.error('Failed to restore session from cached tokens:', tokenError);
              await AsyncStorage.removeItem(AUTH_TOKENS_KEY);
              console.log('Removed invalid cached tokens from AsyncStorage');
            }
          }
        } catch (parseError) {
          console.error('Error parsing cached token data:', parseError);
          await AsyncStorage.removeItem(AUTH_TOKENS_KEY);
        }
      } else {
        console.log('No cached tokens found in AsyncStorage');
      }

      console.log('All session restoration attempts failed');
      set({ hasCheckedAuth: true, isLoading: false, initialized: true });
      return false;
    } catch (error) {
      console.error('Error checking/restoring session:', error);
      set({ hasCheckedAuth: true, isLoading: false, initialized: true });
      return false;
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Ensure Google SignIn is configured
      console.log('Starting Google sign-in process');
      configureGoogleSignin();
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Google Play Services available');
      
      // Debug before sign-in attempt
      await debugGoogleSignIn();
      
      // Sign in with Google
      console.log('Attempting to sign in with Google');
      
      // Special handling for DEVELOPER_ERROR
      let retryCount = 0;
      const maxRetries = 2;
      
      while (retryCount <= maxRetries) {
        try {
          // Sign in with Google
          await GoogleSignin.signIn();
          console.log('GoogleSignin.signIn() completed successfully');
          break; // If successful, exit the retry loop
        } catch (signInError: any) {
          retryCount++;
          
          // Check for DEVELOPER_ERROR specifically
          if (signInError?.message?.includes('DEVELOPER_ERROR')) {
            console.error('DEVELOPER_ERROR detected. Retrying with explicit configuration.');
            console.error('Error details:', signInError);
            
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (retryCount === maxRetries) {
              throw signInError; // If we've maxed out retries, rethrow
            }
            
            // Try explicit configuration
            if (Platform.OS === 'android') {
              GoogleSignin.configure({
                webClientId: '383417509865-kg70tvpj3ofpqhn58tb34dplgtim32lk.apps.googleusercontent.com',
                scopes: ['email', 'profile'],
                offlineAccess: false,
                forceCodeForRefreshToken: false,
              });
            }
          } else {
            throw signInError; // If it's not a DEVELOPER_ERROR, rethrow immediately
          }
        }
      }
      
      // Get the tokens
      console.log('Getting tokens after sign-in');
      const { accessToken, idToken } = await GoogleSignin.getTokens();
      console.log('Tokens retrieved:', { 
        hasAccessToken: !!accessToken, 
        hasIdToken: !!idToken 
      });
      
      if (!idToken) {
        throw new Error('No ID token present');
      }

      // Store tokens for future use
      await AsyncStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify({ accessToken, idToken }));
      console.log('Tokens stored in AsyncStorage');

      // Create a Google credential with the token
      const firebaseAuth = auth();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken, accessToken);

      // Sign-in the user with the credential
      console.log('Signing in with Firebase');
      const userCredential = await firebaseAuth.signInWithCredential(googleCredential);
      set({ user: userCredential.user, isLoading: false, initialized: true, hasCheckedAuth: true });
      
      console.log('Google sign-in successful, user authenticated');
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      if (error instanceof Error) {
        if (error.message === statusCodes.SIGN_IN_CANCELLED) {
          set({ error: 'Sign in was cancelled', isLoading: false });
        } else if (error.message === statusCodes.IN_PROGRESS) {
          set({ error: 'Sign in is already in progress', isLoading: false });
        } else if (error.message === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          set({ error: 'Play services not available or outdated', isLoading: false });
        } else {
          set({ error: error.message, isLoading: false });
        }
      } else {
        set({ error: 'An unknown error occurred', isLoading: false });
      }
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      
      // Revoke Gmail API access
      await revokeGmailAccess().catch((error) => {
        console.error('Failed to revoke Gmail access:', error);
        // Continue with signout even if revocation fails
      });
      
      // Remove cached tokens
      await AsyncStorage.removeItem(AUTH_TOKENS_KEY);
      
      // Ensure Google SignIn is configured before signout
      configureGoogleSignin();
      
      // Sign out from Google
      await GoogleSignin.signOut();
      
      // Sign out from Firebase
      await auth().signOut();
      
      set({ user: null, isLoading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out';
      set({ error: errorMessage, isLoading: false });
    }
  },
})); 
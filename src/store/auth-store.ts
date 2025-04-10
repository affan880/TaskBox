import { create } from 'zustand';
import { getApp } from '@react-native-firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithCredential, 
  GoogleAuthProvider,
  type FirebaseAuthTypes
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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
  refreshAuthentication: () => Promise<boolean>;
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
      const currentUser = await GoogleSignin.getCurrentUser();
      const isSignedIn = currentUser !== null;
      console.log('GoogleSignin sign-in state:', isSignedIn ? 'Signed in' : 'Not signed in');
    } catch (e) {
      console.log('Error checking sign in status:', e);
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

// Configure Google SignIn immediately
console.log('Initial GoogleSignin configuration');
configureGoogleSignin();

// Create the store
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  hasCheckedAuth: false,
  initialized: false,

  setUser: (user: FirebaseAuthTypes.User | null) => {
    if (JSON.stringify(get().user) !== JSON.stringify(user)) {
      set({ user });
    }
  },

  // Add a function to explicitly refresh authentication
  refreshAuthentication: async () => {
    try {
      console.log('Manually refreshing authentication');
      set({ isLoading: true, error: null });
      
      // First, ensure configuration is up to date
      configureGoogleSignin();
      
      // Check if user is already signed in with Google
      let isSignedIn = false;
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        isSignedIn = currentUser !== null;
      } catch (e) {
        console.log('Error checking sign in status:', e);
      }
      console.log(`Current Google Sign-in status: ${isSignedIn ? 'Signed in' : 'Not signed in'}`);
      
      if (isSignedIn) {
        try {
          // Try to get fresh tokens
          console.log('Attempting to refresh tokens...');
          const { accessToken, idToken } = await GoogleSignin.getTokens();
          
          if (idToken) {
            const app = getApp();
            const auth = getAuth(app);
            const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
            
            // Sign in with Firebase again to refresh tokens
            const userCredential = await signInWithCredential(auth, googleCredential);
            set({ user: userCredential.user, error: null });
            console.log('Authentication refreshed successfully');
            return true;
          }
        } catch (tokenError) {
          console.error('Failed to refresh tokens:', tokenError);
          
          // If token refresh fails, try silent sign in
          try {
            console.log('Trying silent sign in...');
            const userInfo = await GoogleSignin.signInSilently();
            if (userInfo) {
              const { accessToken, idToken } = await GoogleSignin.getTokens();
              if (idToken) {
                const app = getApp();
                const auth = getAuth(app);
                const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
                const userCredential = await signInWithCredential(auth, googleCredential);
                set({ user: userCredential.user, error: null });
                console.log('Silent sign-in successful');
                return true;
              }
            }
          } catch (silentError) {
            console.error('Silent sign-in failed:', silentError);
          }
        }
      }
      
      // If we reach here, we need a full re-authentication
      console.log('Need to perform full re-authentication');
      set({ error: 'Authentication needs to be refreshed. Please sign in again.' });
      return false;
    } catch (error) {
      console.error('Error in refreshAuthentication:', error);
      set({ error: 'Failed to refresh authentication' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  initializeAuthListener: () => {
    // Get the Firebase app instance
    const app = getApp();

    // Set up the auth listener using the new API
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseAuthTypes.User | null) => {
      if (JSON.stringify(get().user) !== JSON.stringify(user)) {
        set({ user, hasCheckedAuth: true, isLoading: false, initialized: true });
      }
    });

    // Ensure Google SignIn is configured and then trigger session check
    configureGoogleSignin();
    get().checkAndRestoreSession();

    return unsubscribe;
  },

  checkAndRestoreSession: async () => {
    try {
      console.log('Starting checkAndRestoreSession');
      set({ isLoading: true });

      // First check if Firebase already has active user
      const app = getApp();
      const auth = getAuth(app);
      const currentUser = auth.currentUser;
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
        console.log('Checking if user is signed in with Google');
        const currentUser = await GoogleSignin.getCurrentUser();
        const isSignedIn = currentUser !== null;
        console.log('Google sign-in status:', isSignedIn ? 'Signed in' : 'Not signed in');
        
        if (isSignedIn) {
          console.log('User is signed in with Google, attempting to get tokens');
          try {
            const { accessToken, idToken } = await GoogleSignin.getTokens();
            console.log('Tokens retrieved:', { 
              hasAccessToken: !!accessToken, 
              hasIdToken: !!idToken 
            });
            
            if (!idToken) {
              throw new Error('No ID token present');
            }

            await AsyncStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify({ accessToken, idToken }));
            console.log('Tokens stored in AsyncStorage');

            // Create a Google credential with the token using new API
            const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);

            // Sign-in the user with the credential using new API
            console.log('Signing in with Firebase using Google credential');
            const userCredential = await signInWithCredential(auth, googleCredential);
            console.log('Firebase sign-in successful');
            set({ user: userCredential.user, hasCheckedAuth: true, isLoading: false, initialized: true });
            return true;
          } catch (error) {
            console.log('Error restoring from Google Sign-in:', error);
            try {
              console.log('Attempting silent sign-in as fallback');
              const userInfo = await GoogleSignin.signInSilently();
              console.log('Silent sign-in result:', userInfo ? 'successful' : 'failed');
              
              if (userInfo) {
                console.log('Getting tokens after silent sign-in');
                const { accessToken, idToken } = await GoogleSignin.getTokens();
                if (idToken) {
                  console.log('Creating Google credential from silent sign-in tokens');
                  const auth = getAuth();
                  const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
                  const userCredential = await signInWithCredential(auth, googleCredential);
                  set({ user: userCredential.user, hasCheckedAuth: true, isLoading: false, initialized: true });
                  return true;
                }
              }
            } catch (silentSignInError) {
              console.log('Silent sign-in failed:', silentSignInError);
            }
          }
        }
      } catch (error) {
        console.log('Error in session restoration:', error);
      }

      set({ hasCheckedAuth: true, isLoading: false, initialized: true });
      return false;
    } catch (error) {
      console.error('Error in checkAndRestoreSession:', error);
      set({ error: 'Failed to restore session', hasCheckedAuth: true, isLoading: false, initialized: true });
      return false;
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Sign in with Google and get tokens
      await GoogleSignin.signIn();
      const { accessToken, idToken } = await GoogleSignin.getTokens();
      
      if (!idToken) {
        throw new Error('No ID token present');
      }

      // Create a Google credential with the token
      const app = getApp();
      const auth = getAuth(app);
      const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);

      // Sign-in the user with the credential
      console.log('Signing in with Firebase');
      const userCredential = await signInWithCredential(auth, googleCredential);
      set({ user: userCredential.user, isLoading: false, initialized: true, hasCheckedAuth: true });
      
      return;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      set({ error: error.message || 'Failed to sign in with Google', isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // First try to revoke Gmail access (which is now fail-safe)
      try {
        await revokeGmailAccess();
      } catch (error) {
        // Already logged in the function, continue with sign out
      }
      
      // Sign out from Firebase first
      try {
        const app = getApp();
        const auth = getAuth(app);
        await auth.signOut();
      } catch (firebaseError) {
        console.error('Firebase sign out error:', firebaseError);
        // Continue with Google sign out even if Firebase fails
      }
      
      // Finally sign out from Google
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        console.error('Google sign out error:', googleError);
        // Continue anyway to update the UI state
      }
      
      set({ user: null, isLoading: false, error: null });
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Still set user to null to ensure UI shows logged out state
      set({ user: null, error: error.message || 'Failed to sign out', isLoading: false });
    }
  },
})); 
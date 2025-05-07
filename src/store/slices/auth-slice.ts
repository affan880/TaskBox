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
import { revokeGmailAccess } from 'src/api/gmail-api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Debug flag - only log in development mode and when needed
const DEBUG = __DEV__ && false; // Set to true for verbose debugging

// Export the type
export type AuthState = {
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

// Track if we already configured GoogleSignin
let googleSigninConfigured = false;

// Initialize Google Sign-in configuration
const configureGoogleSignin = () => {
  // Skip if already configured to avoid duplicate configuration logs
  if (googleSigninConfigured) return;
  
  if (DEBUG) {
    console.log('Configuring GoogleSignin with the following client IDs:',
      { webClientId: FIREBASE_WEB_CLIENT_ID ? 'present' : 'missing', 
        iosClientId: FIREBASE_IOS_CLIENT_ID ? 'present' : 'missing' });
  }
      
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
  
  // Mark as configured
  googleSigninConfigured = true;
};

// Helper for debugging Google Sign-In state
const debugGoogleSignIn = async () => {
  if (!DEBUG) return;
  
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
if (DEBUG) console.log('Initial GoogleSignin configuration');
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
      if (DEBUG) console.log('Manually refreshing authentication');
      set({ isLoading: true, error: null });
      
      // First, ensure configuration is up to date
      configureGoogleSignin();
      
      // Check if user is already signed in with Google
      let isSignedIn = false;
      try {
        const currentUser = await GoogleSignin.getCurrentUser();
        isSignedIn = currentUser !== null;
      } catch (e) {
        if (DEBUG) console.log('Error checking sign in status:', e);
      }
      if (DEBUG) console.log(`Current Google Sign-in status: ${isSignedIn ? 'Signed in' : 'Not signed in'}`);
      
      if (isSignedIn) {
        try {
          // Try to get fresh tokens
          if (DEBUG) console.log('Attempting to refresh tokens...');
          const { accessToken, idToken } = await GoogleSignin.getTokens();
          
          if (idToken) {
            const app = getApp();
            const auth = getAuth(app);
            const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
            
            // Sign in with Firebase again to refresh tokens
            const userCredential = await signInWithCredential(auth, googleCredential);
            set({ user: userCredential.user, error: null });
            if (DEBUG) console.log('Authentication refreshed successfully');
            return true;
          }
        } catch (tokenError) {
          console.error('Failed to refresh tokens:', tokenError);
          
          // If token refresh fails, try silent sign in
          try {
            if (DEBUG) console.log('Trying silent sign in...');
            const userInfo = await GoogleSignin.signInSilently();
            if (userInfo) {
              const { accessToken, idToken } = await GoogleSignin.getTokens();
              if (idToken) {
                const app = getApp();
                const auth = getAuth(app);
                const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
                const userCredential = await signInWithCredential(auth, googleCredential);
                set({ user: userCredential.user, error: null });
                if (DEBUG) console.log('Silent sign-in successful');
                return true;
              }
            }
          } catch (silentError) {
            console.error('Silent sign-in failed:', silentError);
          }
        }
      }
      
      // If we reach here, we need a full re-authentication
      if (DEBUG) console.log('Need to perform full re-authentication');
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
    if (DEBUG) console.log('Initializing auth state listener');
    
    // Configure Google SignIn
    configureGoogleSignin();
    
    // Set up Firebase auth state listener
    const app = getApp();
    const auth = getAuth(app);
    
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseAuthTypes.User | null) => {
      if (DEBUG) console.log('Auth state changed:', user ? 'User signed in' : 'No user');
      set({ user, hasCheckedAuth: true, initialized: true, isLoading: false });
    });
    
    return unsubscribe;
  },

  checkAndRestoreSession: async () => {
    try {
      // Check if we have saved tokens
      const tokensJson = await AsyncStorage.getItem(AUTH_TOKENS_KEY);
      
      if (tokensJson) {
        if (DEBUG) console.log('Found saved tokens, attempting to restore session');
        
        // Ensure Google Sign-In is properly configured
        configureGoogleSignin();
        
        // Check current Firebase auth state
        const app = getApp();
        const auth = getAuth(app);
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          if (DEBUG) console.log('Firebase user already authenticated');
          set({ user: currentUser });
          return true;
        }
        
        // Try to refresh authentication
        return await get().refreshAuthentication();
      } else {
        if (DEBUG) console.log('No saved tokens found');
        return false;
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      return false;
    } finally {
      set({ hasCheckedAuth: true });
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Ensure Google Sign-In is configured
      configureGoogleSignin();
      
      // Check if we are already signed in
      await GoogleSignin.hasPlayServices();
      
      // Sign out from GoogleSignin first to ensure a fresh sign in
      try {
        await GoogleSignin.signOut();
        if (DEBUG) console.log('Signed out from Google before sign in');
      } catch (e) {
        if (DEBUG) console.log('Error signing out before sign in:', e);
      }
      
      // Get user info and sign in
      if (DEBUG) console.log('Starting Google Sign In process');
      const userInfo = await GoogleSignin.signIn();
      
      // Get access and ID tokens for Firebase Auth
      const { accessToken, idToken } = await GoogleSignin.getTokens();
      
      if (!idToken) {
        throw new Error('Google Sign In failed - no ID token. Please check your Google Sign-In configuration.');
      }
      
      // Save tokens for later refresh
      try {
        await AsyncStorage.setItem(AUTH_TOKENS_KEY, JSON.stringify({ accessToken, idToken }));
        if (DEBUG) console.log('Tokens saved to AsyncStorage');
      } catch (storageError) {
        console.error('Failed to save tokens:', storageError);
      }
      
      // Create Firebase credential with Google tokens
      const app = getApp();
      const auth = getAuth(app);
      const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
      
      // Sign in to Firebase with credential
      if (DEBUG) console.log('Signing in to Firebase with Google credential');
      const userCredential = await signInWithCredential(auth, googleCredential);
      
      set({ user: userCredential.user, error: null });
      if (DEBUG) console.log('Firebase Authentication successful');
      
    } catch (error: any) {
      console.error('Google Sign In Error:', error);
      let errorMessage = 'Failed to sign in with Google';
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        errorMessage = 'Sign in was cancelled';
      } else if (error.code === 'SIGN_IN_REQUIRED') {
        errorMessage = 'Sign in is required';
      } else if (error.code === 'IN_PROGRESS') {
        errorMessage = 'Sign in is already in progress';
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        errorMessage = 'Google Play Services are not available or outdated';
      } else if (error.message?.includes('no ID token')) {
        errorMessage = 'Google Sign-In configuration error. Please check your setup.';
      }
      
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Try to revoke Gmail access
      try {
        if (DEBUG) console.log('Attempting to revoke Gmail access');
        await revokeGmailAccess();
        if (DEBUG) console.log('Gmail access revoked successfully');
      } catch (revokeError) {
        console.error('Failed to revoke Gmail access:', revokeError);
      }
      
      // Sign out from Firebase
      const app = getApp();
      const auth = getAuth(app);
      
      // Sign out from Google
      try {
        if (DEBUG) console.log('Signing out from Google');
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
        if (DEBUG) console.log('Google sign out successful');
      } catch (googleError) {
        console.error('Google sign out error:', googleError);
      }
      
      // Sign out from Firebase
      try {
        if (DEBUG) console.log('Signing out from Firebase');
        await auth.signOut();
        if (DEBUG) console.log('Firebase sign out successful');
      } catch (firebaseError) {
        console.error('Firebase sign out error:', firebaseError);
      }
      
      // Clear saved tokens
      try {
        await AsyncStorage.removeItem(AUTH_TOKENS_KEY);
        if (DEBUG) console.log('Removed saved tokens from storage');
      } catch (storageError) {
        console.error('Failed to remove tokens from storage:', storageError);
      }
      
      // Update state
      set({ user: null, error: null });
      
    } catch (error: any) {
      console.error('Sign Out Error:', error);
      set({ error: error.message || 'Failed to sign out' });
    } finally {
      set({ isLoading: false });
    }
  },
})); 
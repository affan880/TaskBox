import { create } from 'zustand';
import firebase from '@react-native-firebase/app';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { FIREBASE_WEB_CLIENT_ID, FIREBASE_IOS_CLIENT_ID } from '@env';

type AuthState = {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: FirebaseAuthTypes.User | null) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuthListener: () => () => void;
};

// Initialize Google Sign-in
GoogleSignin.configure({
  webClientId: FIREBASE_WEB_CLIENT_ID,
  iosClientId: FIREBASE_IOS_CLIENT_ID,
});

// Create the store
const useAuthStoreBase = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => {
    // Only update if the user value has changed
    if (JSON.stringify(get().user) !== JSON.stringify(user)) {
      set({ user });
    }
  },

  initializeAuthListener: () => {
    // Return if we already have a user to avoid unnecessary listeners
    if (get().user) return () => {};

    // Set up the auth listener
    const firebaseAuth = auth();
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      // Only update if the user value has changed
      if (JSON.stringify(get().user) !== JSON.stringify(user)) {
        set({ user });
      }
    });

    // Return the cleanup function
    return unsubscribe;
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in with Google
      await GoogleSignin.signIn();
      
      // Get the tokens
      const { accessToken, idToken } = await GoogleSignin.getTokens();
      
      if (!idToken) {
        throw new Error('No ID token present');
      }

      // Create a Google credential with the token
      const firebaseAuth = auth();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken, accessToken);

      // Sign-in the user with the credential
      const userCredential = await firebaseAuth.signInWithCredential(googleCredential);
      set({ user: userCredential.user, isLoading: false });
    } catch (error: unknown) {
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
      set({ isLoading: true, error: null });
      await GoogleSignin.signOut();
      const firebaseAuth = auth();
      await firebaseAuth.signOut();
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sign out failed',
        isLoading: false 
      });
    }
  },
}));

// Create memoized actions
const actions = {
  setUser: useAuthStoreBase.getState().setUser,
  signInWithGoogle: useAuthStoreBase.getState().signInWithGoogle,
  signOut: useAuthStoreBase.getState().signOut,
  initializeAuthListener: useAuthStoreBase.getState().initializeAuthListener,
};

// Export the store with hooks
export const useAuthStore = {
  useUser: () => useAuthStoreBase((state) => state.user),
  useIsLoading: () => useAuthStoreBase((state) => state.isLoading),
  useError: () => useAuthStoreBase((state) => state.error),
  useActions: () => actions,
}; 
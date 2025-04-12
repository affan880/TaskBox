import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  type PropsWithChildren,
} from 'react';
import {
  GoogleSignin,
  statusCodes,
  type User,
  type SignInResponse,
} from '@react-native-google-signin/google-signin';

// --- Types ---

type AuthState = {
  userInfo: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: Error | null;
};

type AuthContextType = AuthState & {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoggedIn: boolean;
  isTokenExpired: () => Promise<boolean>;
  handleTokenRefresh: () => Promise<string | null>;
};

// --- Initial State & Context ---

const initialState: AuthState = {
  userInfo: null,
  accessToken: null,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---

export function AuthProvider({ children }: PropsWithChildren<{}>): React.ReactElement {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  // --- Helper Functions ---

  // Updated: Only sets React state, no storage interaction
  const setUserSession = (user: User | null, token: string | null): void => {
    // Removed email from log to bypass persistent linter error
    console.log('[AuthProvider] Setting session state:', user ? 'User present' : 'null', token ? 'Token present' : 'No token');
    setAuthState((prev) => ({ ...prev, userInfo: user, accessToken: token, error: null }));
  };

  // Updated: Only clears React state
  const clearUserSession = (): void => {
    console.log('[AuthProvider] Clearing session state');
    setUserSession(null, null);
  };

  // --- Core Auth Functions ---

  const signIn = useCallback(async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo: User = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      console.log('[AuthProvider] Sign-in Success:', userInfo);
      console.log('[AuthProvider] Tokens:', tokens);
      setUserSession(userInfo, tokens.accessToken);
    } catch (error: any) {
      console.error('[AuthProvider] Sign-in Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setAuthState((prev) => ({ ...prev, error: new Error('Sign in cancelled.') }));
      } else if (error.code === statusCodes.IN_PROGRESS) {
         setAuthState((prev) => ({ ...prev, error: new Error('Sign in already in progress.') }));
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setAuthState((prev) => ({ ...prev, error: new Error('Play services not available or outdated.') }));
      } else {
        setAuthState((prev) => ({ ...prev, error: error as Error }));
      }
      clearUserSession();
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Check if signed in before attempting revoke/signOut to avoid potential errors
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
          console.log('[AuthProvider] Sign-out Success');
      } else {
          console.log('[AuthProvider] Already signed out, skipping revoke/signOut calls.');
      }
      clearUserSession();
    } catch (error) {
      console.error('[AuthProvider] Sign-out Error:', error);
       setAuthState((prev) => ({ ...prev, error: error as Error }));
       clearUserSession(); // Clear session even on error
    } finally {
       setAuthState((prev) => ({ ...prev, isLoading: false, userInfo: null, accessToken: null }));
    }
  }, []);

  const isTokenExpired = useCallback(async (): Promise<boolean> => {
     console.warn('[AuthProvider] isTokenExpired is using a placeholder implementation.');
     return !authState.accessToken;
  }, [authState.accessToken]);

  const handleTokenRefresh = useCallback(async (): Promise<string | null> => {
     console.log('[AuthProvider] Attempting token refresh...');
     setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
     try {
        const tokens = await GoogleSignin.getTokens();
        console.log('[AuthProvider] Token refresh successful:', tokens);
        // Updated: Only update state, no storage
        setAuthState((prev) => ({...prev, accessToken: tokens.accessToken}));
        // Note: userInfo might not be updated here, may need getCurrentUser if needed
        return tokens.accessToken;
     } catch(error) {
         console.error('[AuthProvider] Token Refresh Error:', error);
         setAuthState((prev) => ({ ...prev, error: error as Error }));
         await signOut();
         return null;
     } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
     }
  }, [signOut]);


  // --- Effect to check initial sign-in state ---

  useEffect(() => {
    const checkSignInStatus = async (): Promise<void> => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      try {
         // Configuration should happen in App.tsx or similar

        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          console.log('[AuthProvider] User already signed in. Getting tokens...');
          const tokens = await GoogleSignin.getTokens();
          console.log('[AuthProvider] Initial user:', currentUser);
          console.log('[AuthProvider] Initial tokens:', tokens);
          setUserSession(currentUser, tokens.accessToken);
        } else {
           console.log('[AuthProvider] User not signed in. No session loaded from storage.');
           clearUserSession(); // Ensure clean state if not signed in
        }
      } catch (error) {
        console.error('[AuthProvider] Initial sign-in check Error:', error);
        setAuthState((prev) => ({ ...prev, error: error as Error }));
        clearUserSession();
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    checkSignInStatus();
    // Removed handleTokenRefresh dependency as it might cause loops if refresh fails on init
  }, []);


  // --- Context Value ---

  const value: AuthContextType = {
    ...authState,
    signIn,
    signOut,
    isLoggedIn: !!authState.userInfo && !!authState.accessToken,
    isTokenExpired,
    handleTokenRefresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- Hook ---

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
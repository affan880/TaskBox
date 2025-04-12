/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import * as React from 'react';
import { StatusBar, AppState, AppStateStatus } from 'react-native';
import { AppNavigator } from '@/navigation/app-navigator';
import { useAuthStore, type AuthState } from '@/store/auth-store';
import { ToastProvider } from '@/components/ui/toast';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/theme-context';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// --- Google Sign-In Configuration ---
// IMPORTANT: Configure Google Sign-In here *before* AuthProvider mounts.
// This should run once when the module is loaded.
GoogleSignin.configure({
  // Replace with your actual Web Client ID from Google Cloud Console
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  // Add all scopes needed for Gmail API access
  scopes: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    // Add other scopes if necessary (e.g., labels, settings)
  ],
  // offlineAccess: true, // Optional: if you need server-side access using a refresh token
});

// Patch Error.stack to handle potential issues with the 'err' package
if (!('stack' in Error.prototype)) {
  Object.defineProperty(Error.prototype, 'stack', {
    configurable: true,
    get() {
      try {
        return this._stack || '';
      } catch (e) {
        return '';
      }
    },
    set(value) {
      this._stack = value;
    }
  });
}

/**
 * TaskBox - A simple task management app with Firebase integration
 */
export default function App() {
  const initializeAuthListener = useAuthStore((state: AuthState) => state.initializeAuthListener);
  const appState = React.useRef(AppState.currentState);

  // Initialize Auth Listener directly
  React.useEffect(() => {
    const unsubscribe = initializeAuthListener();
    
    // Clean up the listener when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [initializeAuthListener]);

  // Set up app state change listener to refresh tokens when app comes to foreground
  React.useEffect(() => {
    // Handle app state changes to refresh tokens when app comes back to foreground
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground, potentially refresh Google token via useAuth?');
        // NOTE: Token refresh for Google Signin might be handled within AuthProvider
        // or you could potentially call authContext.handleTokenRefresh() here if needed.
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <ToastProvider>
              <StatusBar barStyle="dark-content" />
              <AppNavigator />
            </ToastProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

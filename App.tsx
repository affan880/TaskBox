/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-gesture-handler'; // MUST BE FIRST

import * as React from 'react';
import type { JSX } from 'react';
import { StatusBar, AppState, AppStateStatus, LogBox, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from '@/navigation/app-navigator';
import { useAuthStore } from '@/store/slices/auth-slice';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/theme/theme-context';
import { ErrorBoundary } from '@/components/ui/error-boundary'; 
import { AuthProvider } from '@/lib/auth/auth-provider';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Toast from 'react-native-toast-message';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { FIREBASE_WEB_CLIENT_ID, FIREBASE_IOS_CLIENT_ID } from '@env';

LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Non-serializable values were found in the navigation state',
]);

if (Platform.OS === 'android') {
  GoogleSignin.configure({
    webClientId: FIREBASE_WEB_CLIENT_ID,
    offlineAccess: true,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'profile',
      'email',
      'openid'
    ],
  });
} else {
  GoogleSignin.configure({
    webClientId: FIREBASE_WEB_CLIENT_ID,
    iosClientId: FIREBASE_IOS_CLIENT_ID,
    offlineAccess: true,
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'profile',
      'email',
      'openid'
    ],
  });
}

function useAppStateListener(): void {
  const appState = React.useRef(AppState.currentState);

  React.useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground');
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);
}

function useAuthListener(): void {
  const initializeAuthListener = useAuthStore(state => state.initializeAuthListener);

  React.useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);
}
export default function App(): JSX.Element {
  useAuthListener();
  useAppStateListener();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ErrorBoundary>
          <AuthProvider>
            <SafeAreaProvider>
              <ThemeProvider>
                <StatusBar barStyle="dark-content" />
                <AppNavigator />
                <Toast />
              </ThemeProvider>
            </SafeAreaProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from './store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function useGoogleSignIn() {
  const router = useRouter();
  const { hasAcceptedTerms } = useAuthStore();

  const signIn = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!hasAcceptedTerms) {
        // If terms haven't been accepted, navigate to terms screen
        router.push('/auth/terms');
      } else {
        // If terms have been accepted, proceed to main app
        router.replace('/(app)');
      }

      return userInfo;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  }, [hasAcceptedTerms, router]);

  return {
    signIn,
  };
} 
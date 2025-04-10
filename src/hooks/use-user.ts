import { useState, useEffect, useCallback } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function useUser() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);

  // Check if the user is logged in
  const checkLoginStatus = useCallback(async () => {
    try {
      setIsCheckingLogin(true);
      
      try {
        // Try to get the current user - this will throw if not signed in
        const currentUser = await GoogleSignin.getCurrentUser();
        setIsLoggedIn(currentUser !== null);
      } catch (error) {
        console.log('User not signed in');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    } finally {
      setIsCheckingLogin(false);
    }
  }, []);

  // Check login status on mount
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  return {
    isLoggedIn,
    isCheckingLogin,
    checkLoginStatus
  };
} 
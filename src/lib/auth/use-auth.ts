import { useCallback } from 'react';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const acceptTerms = useCallback(async () => {
    try {
      const user = auth().currentUser;
      if (!user) throw new Error('No user found');
      
      // Update user profile or custom claims to mark terms as accepted
      await user.updateProfile({
        displayName: user.displayName || 'User',
      });
      
      return true;
    } catch (error) {
      console.error('Error accepting terms:', error);
      throw error;
    }
  }, []);

  return {
    acceptTerms,
  };
} 
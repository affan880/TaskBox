import * as React from 'react';
import { View, Text } from 'react-native';
import { useAuthStore } from '../../store/auth-store';
import { Button } from '../../components/ui/button';

export function LoginScreen() {
  const { signInWithGoogle } = useAuthStore.useActions();
  const isLoading = useAuthStore.useIsLoading();
  const error = useAuthStore.useError();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', padding: 16 }}>
      {error && (
        <View style={{ marginBottom: 16, padding: 8, backgroundColor: '#fee2e2', borderRadius: 4 }}>
          <Text style={{ color: '#dc2626' }}>{error}</Text>
        </View>
      )}
      <Button
        onPress={signInWithGoogle}
        variant="primary"
        className="w-full"
        isLoading={isLoading}
      >
        Sign in with Google
      </Button>
    </View>
  );
} 
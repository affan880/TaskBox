import * as React from 'react';
import { TermsAcceptance } from '@/components/auth/terms-acceptance';
import { useAuth } from '@/lib/auth/use-auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function TermsScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { acceptTerms } = useAuth();

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      await acceptTerms();
      navigation.replace('Main');
    } catch (error) {
      console.error('Failed to accept terms:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TermsAcceptance
      onAccept={handleAccept}
      isLoading={isLoading}
    />
  );
} 
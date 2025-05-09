import * as React from 'react';
import { View, Linking, StyleSheet } from 'react-native';
import { Text, Button } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Checkbox } from './checkbox';

type Props = {
  onAccept: () => void;
  isLoading?: boolean;
};

export function TermsAcceptance({ onAccept, isLoading }: Props) {
  const [isChecked, setIsChecked] = React.useState(false);
  const insets = useSafeAreaInsets();

  const handleOpenTerms = () => {
    Linking.openURL('https://taskbox.space/Terms-of-Use.html');
  };

  const handleOpenPrivacy = () => {
    Linking.openURL('https://taskbox.space/Privacy-Policy.html');
  };

  return (
    <View 
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom }
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          Welcome to Plexar!
        </Text>
        
        <Text style={styles.subtitle}>
          To continue, please review and agree to our terms:
        </Text>

        <View style={styles.checkboxContainer}>
          <Checkbox
            value={isChecked}
            onValueChange={setIsChecked}
            label={
              <Text style={styles.checkboxLabel}>
                I have read and agree to the{' '}
                <Text 
                  style={styles.link}
                  onPress={handleOpenTerms}
                >
                  Terms of Use
                </Text>
                {' '}and acknowledge our{' '}
                <Text 
                  style={styles.link}
                  onPress={handleOpenPrivacy}
                >
                  Privacy Policy
                </Text>
              </Text>
            }
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          onPress={onAccept}
          disabled={!isChecked || isLoading}
          isLoading={isLoading}
          style={styles.button}
        >
          Create Account & Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  link: {
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    width: '100%',
  },
}); 
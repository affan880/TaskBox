import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/slices/auth-slice';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '@/navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export function TermsScreen() {
  const [isAccepted, setIsAccepted] = React.useState(false);
  const { setHasAcceptedTerms } = useAuthStore();
  const navigation = useNavigation<AuthNavigationProp>();

  // Animation values
  const contentAnimation = React.useRef(new Animated.Value(0)).current;
  const buttonAnimation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(contentAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAccept = () => {
    setHasAcceptedTerms(true);
    navigation.navigate('Login');
  };

  const openTerms = () => {
    Linking.openURL('https://taskbox.space/Terms-of-Use.html');
  };

  const openPrivacy = () => {
    Linking.openURL('https://taskbox.space/Privacy-Policy.html');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: contentAnimation,
              transform: [
                {
                  translateY: contentAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.header}>
            <Icon name="shield-check" size={48} color="#4CAF50" />
            <Text style={styles.title}>Welcome to Plexar!</Text>
            <Text style={styles.subtitle}>
              To continue, please review and agree to our terms
            </Text>
          </View>

          <View style={styles.termsContainer}>
            <Text style={styles.termsTitle}>Terms of Service</Text>
            <Text style={styles.termsText}>
              By using Plexar, you agree to our Terms of Service and Privacy Policy. 
              These terms outline how we handle your data and what you can expect from our service.
            </Text>

            <View style={styles.linksContainer}>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={openTerms}
              >
                <Icon name="file-document-outline" size={20} color="#4CAF50" />
                <Text style={styles.linkText}>View Terms of Service</Text>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkButton}
                onPress={openPrivacy}
              >
                <Icon name="shield-outline" size={20} color="#4CAF50" />
                <Text style={styles.linkText}>View Privacy Policy</Text>
                <Icon name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setIsAccepted(!isAccepted)}
            >
              <View style={[styles.checkbox, isAccepted && styles.checkboxChecked]}>
                {isAccepted && <Icon name="check" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxText}>
                I have read and agree to the Terms of Service and Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View 
        style={[
          styles.footer,
          {
            opacity: buttonAnimation,
            transform: [
              {
                translateY: buttonAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.button, !isAccepted && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={!isAccepted}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  termsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  termsText: {
    fontSize: 15,
    color: '#4a4a4a',
    lineHeight: 22,
    marginBottom: 24,
  },
  linksContainer: {
    marginBottom: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  checkboxText: {
    flex: 1,
    fontSize: 15,
    color: '#4a4a4a',
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
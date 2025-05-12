import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  StatusBar,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/slices/auth-slice';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthNavigationProp, AuthStackParamList } from '@/navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

type TermsScreenRouteProp = RouteProp<AuthStackParamList, 'Terms'>;

export function TermsScreen() {
  const { setHasAcceptedTerms } = useAuthStore();
  const navigation = useNavigation<AuthNavigationProp>();
  const route = useRoute<TermsScreenRouteProp>();

  const handleAccept = async () => {
    await setHasAcceptedTerms(true);
    
    if (route.params?.onAccept) {
      await route.params.onAccept();
    }
    
    navigation.goBack();
  };

  const openTerms = () => {
    Linking.openURL('http://plexar.xyz/terms-of-use/');
  };

  const openPrivacy = () => {
    Linking.openURL('http://plexar.xyz/privacy-policy/');
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <LinearGradient
        colors={['#121212', '#2A2A2A']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainContent}>
          {/* Header */}
          <Text style={styles.title}>Terms & Privacy</Text>

          {/* Content */}
          <View style={styles.termsContainer}>
            {/* Terms Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="file-document-outline" size={24} color="#0066ff" />
                <Text style={styles.sectionTitle}>Terms of Service</Text>
              </View>
              <Text style={styles.termsText}>
                By using our application, you agree to these terms. Please read them carefully before proceeding.
              </Text>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={openTerms}
              >
                <Text style={styles.linkText}>View Full Terms</Text>
                <Icon name="chevron-right" size={20} color="#0066ff" />
              </TouchableOpacity>
            </View>

            {/* Privacy Section */}
            <View style={[styles.section, { borderBottomWidth: 0 }]}>
              <View style={styles.sectionHeader}>
                <Icon name="shield-outline" size={24} color="#0066ff" />
                <Text style={styles.sectionTitle}>Privacy Policy</Text>
              </View>
              <Text style={styles.termsText}>
                We take your privacy seriously. Learn how we collect and protect your data.
              </Text>
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={openPrivacy}
              >
                <Text style={styles.linkText}>View Full Policy</Text>
                <Icon name="chevron-right" size={20} color="#0066ff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
            >
              <Text style={styles.acceptButtonText}>Accept & Continue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: '#ff3333',
    padding: 12,
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#000000',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  termsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    overflow: 'hidden',
  },
  section: {
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E5E5',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#000000',
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderWidth: 2,
    borderColor: '#0066ff',
    borderRadius: 4,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066ff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonContainer: {
    marginTop: 24,
  },
  acceptButton: {
    backgroundColor: '#0066ff',
    paddingVertical: 14,
    borderWidth: 4,
    borderColor: '#000000',
    marginBottom: 12,
    transform: [{ rotate: '-1deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  declineButton: {
    backgroundColor: '#ff3333',
    paddingVertical: 14,
    borderWidth: 4,
    borderColor: '#000000',
    transform: [{ rotate: '1deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  declineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
}); 
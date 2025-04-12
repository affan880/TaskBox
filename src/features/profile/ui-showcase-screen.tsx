import * as React from 'react';
import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native';
import { Screen } from '../../components/ui/screen';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from '../../components/ui/toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../theme/colors';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';

type UIShowcaseScreenProps = {
  navigation: any;
};

export function UIShowcaseScreen({ navigation }: UIShowcaseScreenProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [nameError, setNameError] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Animation references
  const cardRef = React.useRef<Animatable.View & View>(null);
  
  // Form validation
  const validateForm = () => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    return isValid;
  };
  
  // Form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      toast.show({
        message: 'Please fix the errors in the form',
        type: 'error',
        position: 'bottom'
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.show({
        message: 'Form submitted successfully!',
        type: 'success',
        position: 'bottom'
      });
      
      // Reset form
      setName('');
      setEmail('');
    }, 2000);
  };
  
  // Demonstrate different toast types
  const showSuccessToast = () => {
    toast.show({
      message: 'Operation completed successfully!',
      type: 'success',
      position: 'bottom'
    });
  };
  
  const showErrorToast = () => {
    toast.show({
      message: 'An error occurred. Please try again.',
      type: 'error',
      position: 'bottom'
    });
  };
  
  const showInfoToast = () => {
    toast.show({
      message: 'Here is some useful information.',
      type: 'info',
      position: 'top'
    });
  };
  
  const showWarningToast = () => {
    toast.show({
      message: 'Warning: This action cannot be undone.',
      type: 'warning',
      position: 'top'
    });
  };
  
  // Animation example
  const animateCard = () => {
    if (cardRef.current) {
      cardRef.current.animate({
        0: { scaleX: 1, scaleY: 1, opacity: 1 },
        0.5: { scaleX: 0.9, scaleY: 0.9, opacity: 0.7 },
        1: { scaleX: 1, scaleY: 1, opacity: 1 }
      }, 800);
    }
  };
  
  // Navigation functions
  const navigateToImageShowcase = () => {
    navigation.navigate('ImageShowcase');
  };
  
  return (
    <Screen 
      scrollable={true} 
      scrollViewProps={{ 
        contentContainerStyle: styles.container,
        keyboardShouldPersistTaps: 'handled'
      }}
      accessibilityLabel="UI Components Showcase Screen"
    >
      <Text style={styles.screenTitle}>UI Components</Text>
      <Text style={styles.screenDescription}>
        This screen demonstrates the enhanced UI components with modern design principles and accessibility features.
      </Text>
      
      {/* Showcase Navigation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Component Showcases</Text>
        <Text style={styles.sectionDescription}>
          Navigate to dedicated showcase screens for specific components.
        </Text>
        
        <View style={styles.componentRow}>
          <Button
            variant="primary"
            leftIcon={<Icon name="image" size={20} color="#fff" />}
            accessibilityLabel="Image Showcase"
            accessibilityHint="Navigate to the Image component showcase"
            onPress={navigateToImageShowcase}
          >
            Image Showcase
          </Button>
        </View>
      </View>
      
      {/* Section: Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Buttons</Text>
        <Text style={styles.sectionDescription}>
          Buttons with different variants, sizes, and states.
        </Text>
        
        <View style={styles.componentRow}>
          <Button
            variant="primary"
            accessibilityLabel="Primary button"
            accessibilityHint="Demonstrates a primary button"
            onPress={() => showSuccessToast()}
          >
            Primary
          </Button>
          
          <Button
            variant="secondary"
            accessibilityLabel="Secondary button"
            accessibilityHint="Demonstrates a secondary button"
            onPress={() => showInfoToast()}
          >
            Secondary
          </Button>
          
          <Button
            variant="outline"
            accessibilityLabel="Outline button"
            accessibilityHint="Demonstrates an outline button"
            onPress={() => showWarningToast()}
          >
            Outline
          </Button>
        </View>
        
        <View style={styles.componentRow}>
          <Button
            variant="ghost"
            accessibilityLabel="Ghost button"
            accessibilityHint="Demonstrates a ghost button"
            onPress={() => showErrorToast()}
          >
            Ghost
          </Button>
          
          <Button
            variant="danger"
            accessibilityLabel="Danger button"
            accessibilityHint="Demonstrates a danger button"
            onPress={() => toast.show({ message: 'Danger action triggered', type: 'error' })}
          >
            Danger
          </Button>
          
          <Button
            variant="primary"
            isLoading={true}
            accessibilityLabel="Loading button"
            accessibilityHint="Demonstrates a loading button state"
            onPress={() => {}}
          >
            Loading
          </Button>
        </View>
        
        <View style={styles.componentRow}>
          <Button
            variant="primary"
            size="sm"
            accessibilityLabel="Small button"
            accessibilityHint="Demonstrates a small button"
            onPress={() => {}}
          >
            Small
          </Button>
          
          <Button
            variant="primary"
            size="md"
            accessibilityLabel="Medium button"
            accessibilityHint="Demonstrates a medium button"
            onPress={() => {}}
          >
            Medium
          </Button>
          
          <Button
            variant="primary"
            size="lg"
            accessibilityLabel="Large button"
            accessibilityHint="Demonstrates a large button"
            onPress={() => {}}
          >
            Large
          </Button>
        </View>
        
        <View style={styles.componentRow}>
          <Button
            variant="primary"
            leftIcon={<Icon name="account" size={20} color="#fff" />}
            accessibilityLabel="Button with left icon"
            accessibilityHint="Demonstrates a button with a left icon"
            onPress={() => {}}
          >
            With Icon
          </Button>
          
          <Button
            variant="outline"
            rightIcon={<Icon name="arrow-right" size={20} color={COLORS.brand.primary} />}
            accessibilityLabel="Button with right icon"
            accessibilityHint="Demonstrates a button with a right icon"
            onPress={() => {}}
          >
            Next
          </Button>
        </View>
      </View>
      
      {/* Section: Form Inputs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Form Inputs</Text>
        <Text style={styles.sectionDescription}>
          Input fields with accessibility and validation.
        </Text>
        
        <Animatable.View 
          ref={cardRef}
          style={styles.formCard}
          animation="fadeInUp"
          duration={800}
          useNativeDriver
        >
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            error={nameError}
            leftIcon={<Icon name="account" size={24} color={COLORS.text.tertiary} />}
            accessibilityLabel="Full name input field"
            accessibilityHint="Enter your full name"
          />
          
          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            error={emailError}
            leftIcon={<Icon name="email" size={24} color={COLORS.text.tertiary} />}
            keyboardType="email-address"
            autoCapitalize="none"
            accessibilityLabel="Email address input field"
            accessibilityHint="Enter your email address"
          />
          
          <View style={styles.formButtonContainer}>
            <Button
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleSubmit}
              accessibilityLabel="Submit form button"
              accessibilityHint="Submit the form with your information"
            >
              Submit
            </Button>
          </View>
        </Animatable.View>
        
        <View style={styles.animateButtonContainer}>
          <Button
            variant="outline"
            onPress={animateCard}
            accessibilityLabel="Animate card button"
            accessibilityHint="Triggers animation on the form card"
          >
            Animate Card
          </Button>
        </View>
      </View>
      
      {/* Section: Toast Messages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Toast Messages</Text>
        <Text style={styles.sectionDescription}>
          Toast notifications for user feedback.
        </Text>
        
        <View style={styles.componentRow}>
          <Button
            variant="primary"
            onPress={showSuccessToast}
            accessibilityLabel="Show success toast button"
            accessibilityHint="Displays a success toast notification"
          >
            Success
          </Button>
          
          <Button
            variant="outline"
            onPress={showInfoToast}
            accessibilityLabel="Show info toast button"
            accessibilityHint="Displays an information toast notification"
          >
            Info
          </Button>
          
          <Button
            variant="danger"
            onPress={showErrorToast}
            accessibilityLabel="Show error toast button"
            accessibilityHint="Displays an error toast notification"
          >
            Error
          </Button>
          
          <Button
            variant="secondary"
            onPress={showWarningToast}
            accessibilityLabel="Show warning toast button"
            accessibilityHint="Displays a warning toast notification"
          >
            Warning
          </Button>
        </View>
      </View>
      
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>
          This screen demonstrates UI/UX best practices with a focus on accessibility, responsive design, and user feedback.
        </Text>
        
        <Button
          variant="outline"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back button"
          accessibilityHint="Returns to the previous screen"
        >
          Go Back
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  screenDescription: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
    borderRadius: 12,
    backgroundColor: COLORS.surface.primary,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
  },
  componentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  formCard: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: COLORS.surface.elevated,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    marginBottom: 16,
  },
  formButtonContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  animateButtonContainer: {
    alignItems: 'center',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
}); 
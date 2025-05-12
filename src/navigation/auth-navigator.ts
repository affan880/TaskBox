import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Terms: {
    onAccept?: () => Promise<void>;
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export { Stack as AuthStack }; 
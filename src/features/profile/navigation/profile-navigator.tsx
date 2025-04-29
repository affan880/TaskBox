import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../profile-screen';
import { EditProfileScreen } from '../screens/edit-profile-screen';
import { LanguageScreen } from '../screens/language-screen';
import { FeedbackScreen } from '../screens/feedback-screen';
import { AboutScreen } from '../screens/about-screen';
import { RootStackParamList } from '@/navigation/app-navigator';

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Language: undefined;
  Feedback: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
    </Stack.Navigator>
  );
} 
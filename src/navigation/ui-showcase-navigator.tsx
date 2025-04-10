import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UIShowcaseScreen } from '../screens/profile/ui-showcase-screen';
import { ImageShowcase } from '../screens/ui-showcase/image-showcase';
import { useTheme } from '../theme/theme-context';

export type UIShowcaseStackParamList = {
  UIShowcaseHome: undefined;
  ImageShowcase: undefined;
};

const Stack = createNativeStackNavigator<UIShowcaseStackParamList>();

export function UIShowcaseNavigator() {
  const { colors } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="UIShowcaseHome"
        component={UIShowcaseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ImageShowcase"
        component={ImageShowcase}
        options={{ 
          title: 'Image Component',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
} 
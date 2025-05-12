import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './auth-navigator';

export type TaskStackParamList = {
  'Tasks': undefined;
  'Task.Details': { taskId: string };
  'Task.Edit': { taskId: string };
  'Task.Create': undefined;
};

export type RootStackParamList = {
  MainTabs: { initialScreen?: 'Email' | 'Compose' | 'Home' | 'Profile' };
  Auth: NavigatorScreenParams<AuthStackParamList>;
  ProjectDetail: undefined;
  TaskList: undefined;
  Compose: undefined;
  ReadEmail: { email: any };
  EditProfile: undefined;
  Language: undefined;
  Feedback: undefined;
  About: undefined;
  AllTasks: undefined;
  TaskCreation: undefined;
  TaskStack: NavigatorScreenParams<TaskStackParamList>;
  Main: undefined;
  Profile: undefined;
  UIShowcase: undefined;
  ThemeSettings: undefined;
  NotificationSettings: undefined;
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  DeleteAccount: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type TaskStackScreenProps<T extends keyof TaskStackParamList> = 
  CompositeScreenProps<
    NativeStackScreenProps<TaskStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type NavigationProps = {
  navigation: RootStackScreenProps<keyof RootStackParamList>['navigation'];
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type { AuthStackParamList }; 
import * as React from 'react';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PagerView from 'react-native-pager-view';
import { 
  ActivityIndicator, 
  View, 
  StyleSheet,
  TouchableOpacity,
  Text,
  Keyboard,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Use MaterialCommunityIcons for more variety
import { useTheme } from 'src/theme/theme-context';
import { useAuthStore } from 'src/store/auth-store';
import { AuthNavigator } from './auth-navigator';
import { ProfileNavigator } from '@/features/profile/navigation/profile-navigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TaskScreen } from 'src/features/tasks/task-screen';
import { ProjectDetailScreen } from '@/features/tasks/project-detail-screen';
import { TaskListScreen } from '@/features/tasks/task-list-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { EmailScreen } from 'src/features/email/email-screen';
import { ComposeScreen } from 'src/features/email/compose-screen';
import { EmailDetailScreen } from 'src/features/email/email-detail-screen';
import { AllTasksScreen } from 'src/features/tasks/all-tasks-screen';
import { TaskCreationScreen } from '@/features/tasks/task-creation-screen';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

// Define navigator types
export type RootStackParamList = {
  MainTabs: { initialScreen?: 'Email' | 'Compose' | 'Home' | 'Profile' };
  Auth: undefined;
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
};

// Updated Tab Param List for the new design
export type MainTabParamList = {
  Email: undefined; // Will represent the left (menu) icon
  Home: undefined;  // Will represent the center (home) icon - Map Tasks here for now
  Profile: undefined; // Will represent the right (people) icon - Map Profile here for now
};

// Add specific screen props if needed, otherwise keep simple
// Example: export type ProfileScreenProps = NativeStackScreenProps<MainTabParamList, 'Following'>;

const Stack = createNativeStackNavigator<RootStackParamList>();
// const Tab = createBottomTabNavigator<MainTabParamList>(); // No longer using Tab Navigator

// Remove unused dimensions
// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Reusable Tab Item Component ---
type TabItemProps = {
  isFocused: boolean;
  config: { focusedIcon: string; unfocusedIcon: string; label?: string };
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

const TabItem = React.memo(({ 
  isFocused, 
  config, 
  colors, 
  onPress, 
  onLongPress, 
  accessibilityLabel, 
  testID
}: TabItemProps) => {
  const label = config.label;

  return (
    <TouchableOpacity
      key={config.focusedIcon}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabItem}
      activeOpacity={0.7}
    >
      {isFocused ? (
        <View style={[styles.activeTabPill, { backgroundColor: colors.brand.primary }]}>
          <Icon 
            name={config.focusedIcon} 
            size={label ? 20 : 24}
            color="#FFFFFF"
          />
          {label && (
            <Text style={styles.activeTabText}>{label}</Text>
          )}
        </View>
      ) : (
        <View style={styles.inactiveIconContainer}> 
          <Icon 
            name={config.unfocusedIcon} 
            size={24} 
            color={colors.text.secondary} 
          />
        </View>
      )}
    </TouchableOpacity>
  );
});

// --- Custom Tab Bar ---
type CustomTabBarProps = {
  activeIndex: number;
  routes: { name: string; key: string }[];
  onTabPress: (index: number) => void;
};

const CustomTabBar = React.memo(({ activeIndex, routes, onTabPress }: CustomTabBarProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);

  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Don't render the tab bar if keyboard is visible on Android
  if (Platform.OS === 'android' && isKeyboardVisible) {
    return null;
  }

  const tabConfig: { [key: string]: { focusedIcon: string; unfocusedIcon: string; label?: string } } = {
    Email: { focusedIcon: 'email', unfocusedIcon: 'email-outline', label: 'Inbox' },
    Compose: { focusedIcon: 'pencil', unfocusedIcon: 'pencil-outline', label: 'Compose' },
    Home: { focusedIcon: 'format-list-checks', unfocusedIcon: 'format-list-bulleted', label: 'Tasks' },
    Profile: { focusedIcon: 'account-circle', unfocusedIcon: 'account-circle-outline', label: 'Profile' },
  };

  return (
    <View style={[
      styles.tabBarContainer, 
      { 
        backgroundColor: colors.background.primary, 
        shadowColor: colors.text.secondary, 
        paddingBottom: insets.bottom || 8 
      }
    ]}>
      {routes.map((route, index) => {
        const config = tabConfig[route.name] || { focusedIcon: 'help-circle', unfocusedIcon: 'help-circle-outline' };
        const isFocused = activeIndex === index;

        return (
          <TabItem
            key={route.key}
            isFocused={isFocused}
            config={config}
            colors={colors}
            onPress={() => onTabPress(index)}
            onLongPress={() => {/* No operation */}}
            accessibilityLabel={`${route.name} tab`}
            testID={`tab-${route.name.toLowerCase()}`}
          />
        );
      })}
    </View>
  );
});

// --- Main Swipeable Tab Navigator ---
export const MainTabNavigator = React.memo(() => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const pagerRef = React.useRef<PagerView>(null);
  const route = useRoute<RouteProp<RootStackParamList, 'MainTabs'>>();
  const initialScreen = route.params?.initialScreen;

  // Define the order and components for the pager
  const routes = [
    { key: 'inbox', name: 'Email', component: EmailScreen },
    { key: 'Compose', name: 'Compose', component: ComposeScreen },
    { key: 'tasks', name: 'Home', component: TaskScreen },
    { key: 'profile', name: 'Profile', component: ProfileNavigator },
  ];

  // Set initial page based on navigation params
  React.useEffect(() => {
    if (initialScreen) {
      const index = routes.findIndex(r => r.name === initialScreen);
      if (index !== -1) {
        pagerRef.current?.setPage(index);
        setActiveIndex(index);
      }
    }
  }, [initialScreen]);

  // Navigate PagerView when a tab is pressed
  const handleTabPress = React.useCallback((index: number) => {
    pagerRef.current?.setPage(index);
  }, []);

  // Update the active index when the page changes
  const handlePageSelected = React.useCallback((event: { nativeEvent: { position: number } }) => {
    setActiveIndex(event.nativeEvent.position);
  }, []);

  return (
    <View style={styles.pagerContainer}> 
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {routes.map((route) => (
          <View key={route.key} style={styles.page}>
            <route.component />
          </View>
        ))}
      </PagerView>
      <CustomTabBar 
        activeIndex={activeIndex}
        routes={routes.map(r => ({ key: r.key, name: r.name }))}
        onTabPress={handleTabPress}
      />
    </View>
  );
});

// --- Navigation Root (Authentication Logic) ---
export const NavigationRoot = React.memo(({ forceAuthScreen, onNavigated }: { forceAuthScreen?: boolean; onNavigated?: () => void }) => {
  const { user, isLoading, initialized, setUser } = useAuthStore();
  const { colors } = useTheme();
  const didForceAuth = React.useRef(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const pagerRef = React.useRef<PagerView>(null);

  React.useEffect(() => {
    if (forceAuthScreen && user && !didForceAuth.current && onNavigated) {
      didForceAuth.current = true;
      onNavigated();
      setUser(null);
    } else if (!forceAuthScreen) {
      didForceAuth.current = false;
    }
  }, [forceAuthScreen, user, onNavigated, setUser]);

  if (isLoading || !initialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={MainTabNavigator}
          />
          <Stack.Screen 
            name="ProjectDetail" 
            component={ProjectDetailScreen} 
          />
          <Stack.Screen 
            name="TaskList" 
            component={TaskListScreen} 
          />
          <Stack.Screen 
            name="AllTasks" 
            component={AllTasksScreen} 
          />
          <Stack.Screen 
            name="TaskCreation" 
            component={TaskCreationScreen} 
          />
          <Stack.Screen 
            name="Compose" 
            component={ComposeScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: true,
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => {
                    // If we're in the pager view, go back to the previous page
                    if (pagerRef.current) {
                      pagerRef.current.setPage(0);
                    } else {
                      // If we're in the modal, go back
                      navigation.goBack();
                    }
                  }}
                  style={{ marginLeft: 16 }}
                >
                  <Icon name="arrow-left" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              ),
              headerTitle: 'New Message',
              headerStyle: {
                backgroundColor: colors.background.primary,
              },
              headerTintColor: colors.text.primary,
            }}
          />
          <Stack.Screen
            name="ReadEmail"
            component={EmailDetailScreen}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </Stack.Navigator>
  );
});

// --- App Navigator Export ---
export const AppNavigator = React.memo(({ forceAuthScreen, onNavigated }: { forceAuthScreen?: boolean; onNavigated?: () => void }) => {
  const { colors } = useTheme();
  
  // Create a complete theme object with required fonts property
  // Use type assertion to bypass type checking for our custom theme
  const navigationTheme: any = {
    dark: false,
    colors: {
      primary: colors.brand.primary,
      background: colors.background.primary,
      card: colors.background.primary,
      text: colors.text.primary,
      border: colors.border.medium || '#E1E1E1',
      notification: colors.status.error,
    },
    // Add default fonts configuration to fix the "Cannot read property 'regular' of undefined" error
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      light: {
        fontFamily: 'System',
        fontWeight: '300',
      },
      thin: {
        fontFamily: 'System',
        fontWeight: '100',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900',
      },
    }
  };
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={navigationTheme}>
        <NavigationRoot forceAuthScreen={forceAuthScreen} onNavigated={onNavigated} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
});

// --- Styles ---
const styles = StyleSheet.create({
  pagerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBarContainer: {
    position: 'absolute', 
    bottom: 20,
    alignSelf: 'center', 
    flexDirection: 'row',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    paddingHorizontal: 8,
    width: '92%',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    minWidth: 64,
  },
  inactiveIconContainer: { 
    alignItems: 'center',    
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: '100%',
    opacity: 0.7,
  },
  activeTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,        
    height: '100%',          
  },
  activeTabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
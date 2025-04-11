import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'; // No longer needed
import PagerView from 'react-native-pager-view';
import { 
  ActivityIndicator, 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity,
  Text,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // Use MaterialCommunityIcons for more variety
import { useTheme } from '../theme/theme-context';
import { useAuthStore } from '../store/auth-store';
import { AuthNavigator } from './auth-navigator';
import { ProfileScreen } from '../screens/profile/profile-screen';
import { EmailDrawerNavigator } from './email-drawer-navigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TaskScreen } from '../screens/tasks/task-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Needed for positioning

// Define navigator types
export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
};

// Updated Tab Param List for the new design
export type MainTabParamList = {
  Email: undefined; // Will represent the left (menu) icon
  Home: undefined;  // Will represent the center (home) icon - Map Tasks here for now
  Following: undefined; // Will represent the right (people) icon - Map Profile here for now
};

// Add specific screen props if needed, otherwise keep simple
// Example: export type ProfileScreenProps = NativeStackScreenProps<MainTabParamList, 'Following'>;

const Stack = createNativeStackNavigator<RootStackParamList>();
// const Tab = createBottomTabNavigator<MainTabParamList>(); // No longer using Tab Navigator

// Remove unused dimensions
// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Reusable Tab Item Component (Simplified) ---
type TabItemProps = {
  isFocused: boolean;
  config: { focusedIcon: string; unfocusedIcon: string; label?: string };
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
  onLongPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
};

// Renamed component
function TabItem({ 
  isFocused, 
  config, 
  colors, 
  onPress, 
  onLongPress, 
  accessibilityLabel, 
  testID
}: TabItemProps) {
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
      style={styles.tabItem} // Basic style with padding
    >
      {isFocused ? (
        // Use standard View
        <View style={styles.activeTabPill}>
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
        // Use standard View
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
}

// --- Custom Tab Bar (Using Simplified TabItem) ---
type CustomTabBarProps = {
  activeIndex: number;
  routes: { name: string; key: string }[];
  onTabPress: (index: number) => void;
};

function CustomTabBar({ activeIndex, routes, onTabPress }: CustomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const tabConfig: { [key: string]: { focusedIcon: string; unfocusedIcon: string; label?: string } } = {
    Email: { focusedIcon: 'menu', unfocusedIcon: 'menu' },
    Home: { focusedIcon: 'home', unfocusedIcon: 'home-outline', label: 'Home' },
    Following: { focusedIcon: 'account-group', unfocusedIcon: 'account-group', label: 'Following' },
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
          <TabItem // Use simplified component
            key={route.key}
            isFocused={isFocused}
            config={config}
            colors={colors}
            onPress={() => onTabPress(index)}
            onLongPress={() => { /* Implement if needed */ }}
          />
        );
      })}
    </View>
  );
}

// --- Main Swipeable Tab Navigator ---
function MainTabNavigator() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const pagerRef = React.useRef<PagerView>(null);

  // Define the order and components for the pager
  const routes = [
    { key: 'email', name: 'Email', component: EmailDrawerNavigator },
    { key: 'home', name: 'Home', component: TaskScreen },
    { key: 'following', name: 'Following', component: ProfileScreen as React.FC },
  ];

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
          // Each child of PagerView is a page
          <View key={route.key} style={styles.page}>
            <route.component />
          </View>
        ))}
      </PagerView>
      {/* Render CustomTabBar below PagerView */}
      <CustomTabBar 
        activeIndex={activeIndex}
        routes={routes.map(r => ({ key: r.key, name: r.name }))} // Pass route names/keys
        onTabPress={handleTabPress}
      />
    </View>
  );
}

// --- Navigation Root (Authentication Logic) ---
function NavigationRoot({ forceAuthScreen, onNavigated }: { forceAuthScreen?: boolean; onNavigated?: () => void }) {
  const { user, isLoading, initialized, setUser } = useAuthStore();
  const { colors } = useTheme();
  const didForceAuth = React.useRef(false);

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
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      )}
    </Stack.Navigator>
  );
}

// --- App Navigator Export ---
export function AppNavigator({ forceAuthScreen, onNavigated }: { forceAuthScreen?: boolean; onNavigated?: () => void }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <NavigationRoot forceAuthScreen={forceAuthScreen} onNavigated={onNavigated} />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  pagerContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Or your app's background color
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
    borderRadius: 5,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 4,
    paddingHorizontal: 5,
    // backgroundColor set dynamically
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,        // Fill height of tab bar
  },
  inactiveIconContainer: { 
    alignItems: 'center',    
    justifyContent: 'center',
    paddingHorizontal: 12, // <-- Add padding here for inactive spacing
    height: '100%', // Ensure vertical alignment within tabItem space
  },
  activeTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D9BF0',
    paddingVertical: 8,      
    paddingHorizontal: 12,   // Padding inside the pill
    borderRadius: 5,        
    height: '100%',          
  },
  activeTabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
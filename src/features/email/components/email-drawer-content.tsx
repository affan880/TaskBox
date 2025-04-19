import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';
import { 
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps
} from '@react-navigation/drawer';
import { useTheme } from 'src/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';

/**
 * EmailDrawerContent - Custom drawer content component for the email navigation drawer
 * 
 * This component follows the modern Gmail UI design with:
 * - App branding header
 * - Main inbox categories (All, Primary, Social, Promotions)
 * - Collapsible labels section
 * - Settings and help options
 * - Visual indicators for active items and unread counts
 * 
 * @param props - Drawer content props from React Navigation
 */
export function EmailDrawerContent(props: DrawerContentComponentProps) {
  const { colors } = useTheme();
  
  // State to manage expanded/collapsed labels section
  const [showAllLabels, setShowAllLabels] = React.useState(false);
  
  // Shared value for arrow rotation animation
  const labelRotation = useSharedValue(0);
  
  // Animated style for the dropdown arrow
  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${labelRotation.value * 180}deg` }]
    };
  });
  
  /**
   * Toggle the labels section visibility
   * Uses animation for smooth rotation of the dropdown arrow
   */
  const toggleLabels = () => {
    setShowAllLabels(!showAllLabels);
    labelRotation.value = withTiming(labelRotation.value === 0 ? 1 : 0, { duration: 300 });
  };
  
  // Category definitions for the drawer
  const mainCategories = ['AllInbox', 'Primary', 'Social', 'Promotions'];
  const labelCategories = ['Starred', 'Snoozed', 'Important', 'Sent', 'Scheduled', 'Drafts', 'Spam', 'Trash'];
  
  // Badge counts for categories - in a real app, these would come from data
  const categoryBadges = {
    Primary: 12,
    Social: 2,
    Promotions: 28
  };
  
  return (
    <DrawerContentScrollView
      {...props}
      scrollEnabled={false}
      contentContainerStyle={styles.drawerContainer}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background?.primary || '#ffffff' }]}>
        {/* ===== App Header ===== */}
        <View style={styles.header}>
          {/* App Logo */}
          <View style={styles.logoContainer}>
            <Icon name="mail" size={24} color={colors.text?.secondary || '#64748b'} />
          </View>
          
          {/* App Title */}
          <Text style={[styles.headerTitle, { color: colors.text?.primary || '#334155' }]}>
            TaskBox Mail
          </Text>
        </View>
        
        {/* ===== Scrollable content ===== */}
        <ScrollView 
          style={styles.scrollSection} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ----- Main Inbox Categories Section ----- */}
          <View style={styles.section}>
            {/* All Inbox */}
            <TouchableOpacity
              style={[
                styles.navigationItem,
                props.state.routes[props.state.index].name === 'AllInbox' && 
                  [styles.activeItem, { backgroundColor: colors.surface?.highlight || '#eff6ff' }]
              ]}
              onPress={() => props.navigation.navigate('AllInbox')}
            >
              <Icon 
                name="all-inbox" 
                size={22} 
                color={props.state.routes[props.state.index].name === 'AllInbox' 
                  ? colors.text?.primary || '#0f172a' 
                  : colors.text?.secondary || '#64748b'} 
              />
              <Text style={[
                styles.itemLabel,
                { color: colors.text?.primary || '#0f172a' },
                props.state.routes[props.state.index].name === 'AllInbox' && 
                  [styles.activeLabel, { color: colors.text?.primary || '#0f172a' }]
              ]}>
                All inbox
              </Text>
            </TouchableOpacity>
            
            {/* Primary */}
            <TouchableOpacity
              style={[
                styles.navigationItem,
                props.state.routes[props.state.index].name === 'Primary' && 
                  [styles.activeItem, { backgroundColor: colors.surface?.highlight || '#eff6ff' }]
              ]}
              onPress={() => props.navigation.navigate('Primary')}
            >
              <Icon 
                name="inbox" 
                size={22} 
                color={props.state.routes[props.state.index].name === 'Primary' 
                  ? colors.text?.primary || '#0f172a' 
                  : colors.text?.secondary || '#64748b'} 
              />
              <Text style={[
                styles.itemLabel,
                { color: colors.text?.primary || '#0f172a' },
                props.state.routes[props.state.index].name === 'Primary' && 
                  [styles.activeLabel, { color: colors.text?.primary || '#0f172a' }]
              ]}>
                Primary
              </Text>
              
              {/* Unread count badge */}
              {categoryBadges.Primary && (
                <View style={[
                  styles.badge, 
                  { backgroundColor: colors.background?.secondary || '#f1f5f9' }
                ]}>
                  <Text style={[styles.badgeText, { color: colors.text?.secondary || '#64748b' }]}>
                    {categoryBadges.Primary}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Social */}
            <TouchableOpacity
              style={[
                styles.navigationItem,
                props.state.routes[props.state.index].name === 'Social' && 
                  [styles.activeItem, { backgroundColor: colors.surface?.highlight || '#eff6ff' }]
              ]}
              onPress={() => props.navigation.navigate('Social')}
            >
              <Icon 
                name="people" 
                size={22} 
                color={props.state.routes[props.state.index].name === 'Social' 
                  ? colors.text?.primary || '#0f172a' 
                  : colors.text?.secondary || '#64748b'} 
              />
              <Text style={[
                styles.itemLabel,
                { color: colors.text?.primary || '#0f172a' },
                props.state.routes[props.state.index].name === 'Social' && 
                  [styles.activeLabel, { color: colors.text?.primary || '#0f172a' }]
              ]}>
                Social
              </Text>
              
              {/* Unread count badge */}
              {categoryBadges.Social && (
                <View style={[
                  styles.badge, 
                  { backgroundColor: colors.background?.secondary || '#f1f5f9' }
                ]}>
                  <Text style={[styles.badgeText, { color: colors.text?.secondary || '#64748b' }]}>
                    {categoryBadges.Social}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Promotions */}
            <TouchableOpacity
              style={[
                styles.navigationItem,
                props.state.routes[props.state.index].name === 'Promotions' && 
                  [styles.activeItem, { backgroundColor: colors.surface?.highlight || '#eff6ff' }]
              ]}
              onPress={() => props.navigation.navigate('Promotions')}
            >
              <Icon 
                name="local-offer" 
                size={22} 
                color={props.state.routes[props.state.index].name === 'Promotions' 
                  ? colors.text?.primary || '#0f172a' 
                  : colors.text?.secondary || '#64748b'} 
              />
              <Text style={[
                styles.itemLabel,
                { color: colors.text?.primary || '#0f172a' },
                props.state.routes[props.state.index].name === 'Promotions' && 
                  [styles.activeLabel, { color: colors.text?.primary || '#0f172a' }]
              ]}>
                Promotions
              </Text>
              
              {/* Unread count badge */}
              {categoryBadges.Promotions && (
                <View style={[
                  styles.badge, 
                  { backgroundColor: colors.background?.secondary || '#f1f5f9' }
                ]}>
                  <Text style={[styles.badgeText, { color: colors.text?.secondary || '#64748b' }]}>
                    {categoryBadges.Promotions}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* ----- Divider between sections ----- */}
          <View style={[styles.divider, { backgroundColor: colors.border?.light || '#e2e8f0' }]} />
          
          {/* ----- All Labels Section (Collapsible) ----- */}
          <View style={styles.section}>
            {/* Labels section header with dropdown toggle */}
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={toggleLabels}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTitle, { color: colors.text?.secondary || '#64748b' }]}>
                ALL LABELS
              </Text>
              
              {/* Animated rotation arrow */}
              <Animated.View style={rotationStyle}>
                <Icon 
                  name="keyboard-arrow-down" 
                  size={20} 
                  color={colors.text?.secondary || '#64748b'} 
                />
              </Animated.View>
            </TouchableOpacity>
            
            {/* Collapsible labels content */}
            {showAllLabels && (
              <>
                {labelCategories.map((category) => {
                  // Find the route index to determine if this category is active
                  const routeIndex = props.state.routes.findIndex(route => route.name === category);
                  const isActive = props.state.index === routeIndex && routeIndex !== -1;
                  
                  // Find the descriptor with matching route name to get options
                  const descriptor = Object.values(props.descriptors).find(
                    desc => desc.route.name === category
                  );
                  
                  // Extract icon name from the descriptor - this handles the case where
                  // the drawer screen options define a custom icon
                  let iconName = 'label';
                  if (descriptor?.options.drawerIcon) {
                    const icon = descriptor.options.drawerIcon;
                    // Get the icon name from the function props (a bit of a hack but works)
                    iconName = typeof icon === 'function' 
                      ? (icon as any)({ color: '', size: 0, focused: false })?.props?.name || 'label'
                      : 'label';
                  }
                  
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.navigationItem,
                        isActive && [styles.activeItem, { backgroundColor: colors.surface?.highlight || '#eff6ff' }]
                      ]}
                      onPress={() => props.navigation.navigate(category)}
                    >
                      <Icon 
                        name={iconName} 
                        size={22} 
                        color={isActive 
                          ? colors.text?.primary || '#0f172a' 
                          : colors.text?.secondary || '#64748b'} 
                      />
                      <Text style={[
                        styles.itemLabel,
                        { color: colors.text?.primary || '#0f172a' },
                        isActive && [styles.activeLabel, { color: colors.text?.primary || '#0f172a' }]
                      ]}>
                        {descriptor?.options.drawerLabel as string || category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
          
          {/* ----- Divider between sections ----- */}
          <View style={[styles.divider, { backgroundColor: colors.border?.light || '#e2e8f0' }]} />
          
          {/* ----- Settings and Help Section ----- */}
          <View style={styles.section}>
            {/* Settings navigation item */}
            <TouchableOpacity 
              style={styles.navigationItem}
              activeOpacity={0.7}
            >
              <Icon 
                name="settings" 
                size={22} 
                color={colors.text?.secondary || '#64748b'} 
              />
              <Text style={[styles.itemLabel, { color: colors.text?.primary || '#0f172a' }]}>
                Settings
              </Text>
            </TouchableOpacity>
            
            {/* Help & feedback navigation item */}
            <TouchableOpacity 
              style={styles.navigationItem}
              activeOpacity={0.7}
            >
              <Icon 
                name="help-outline" 
                size={22} 
                color={colors.text?.secondary || '#64748b'} 
              />
              <Text style={[styles.itemLabel, { color: colors.text?.primary || '#0f172a' }]}>
                Help & feedback
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </DrawerContentScrollView>
  );
}

/**
 * Styles for the drawer navigation
 * 
 * Design principles:
 * - Clean whitespace with proper padding/margins
 * - Rounded corners for active states (right side only)
 * - Subtle background colors for selected items
 * - Consistent spacing between elements
 * - Clear visual hierarchy with icons, labels and badges
 */
const styles = StyleSheet.create({
  // Main container for the drawer
  drawerContainer: {
    flex: 1,
  },
  
  // Safe area container 
  container: {
    flex: 1,
  },
  
  // Header with logo and app title
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  
  // App logo container
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  
  // App title
  headerTitle: {
    fontSize: 22,
    fontWeight: '500',
  },
  
  // Scrollable content container
  scrollSection: {
    flex: 1,
  },
  
  // Content container for ScrollView
  scrollContent: {
    paddingBottom: 40, // Add padding at bottom for better scroll experience
  },
  
  // Section container for groups of navigation items
  section: {
    paddingVertical: 8,
  },
  
  // Header for collapsible sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // Section title text
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Horizontal divider between sections
  divider: {
    height: 1,
    marginVertical: 8,
  },
  
  // Navigation item (drawer item)
  navigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopRightRadius: 24, // Pill shape on right side only
    borderBottomRightRadius: 24, // Pill shape on right side only
  },
  
  // Active state for navigation item
  activeItem: {
    backgroundColor: '#eff6ff', // Light blue background when active
  },
  
  // Label for navigation item
  itemLabel: {
    fontSize: 15,
    marginLeft: 20,
    flex: 1,
  },
  
  // Active state for label
  activeLabel: {
    fontWeight: '500',
  },
  
  // Badge for showing unread counts
  badge: {
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Text inside badge
  badgeText: {
    fontSize: 13,
    fontWeight: '500',
  }
}); 
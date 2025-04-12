import * as React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
} from 'react-native';
import { 
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps
} from '@react-navigation/drawer';
import { COLORS } from 'src/theme/colors';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';

export function EmailDrawerContent(props: DrawerContentComponentProps) {
  const [showAllLabels, setShowAllLabels] = React.useState(false);
  const labelRotation = useSharedValue(0);
  
  const rotationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${labelRotation.value * 180}deg` }]
    };
  });
  
  const toggleLabels = () => {
    setShowAllLabels(!showAllLabels);
    labelRotation.value = withTiming(labelRotation.value === 0 ? 1 : 0, { duration: 300 });
  };
  
  // Filter the drawer items to show only inbox categories initially
  const mainCategories = ['AllInbox', 'Primary', 'Social', 'Promotions'];
  const labelCategories = ['Starred', 'Snoozed', 'Important', 'Sent', 'Scheduled', 'Drafts', 'Spam', 'Trash'];
  
  return (
    <DrawerContentScrollView
      {...props}
      scrollEnabled={false}
      contentContainerStyle={styles.drawerContainer}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Icon name="mail" size={24} color={COLORS.text.secondary} />
        </View>
        <Text style={styles.headerTitle}>TaskBox Mail</Text>
      </View>
      
      <ScrollView style={styles.scrollSection} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {/* Main inbox categories */}
          {props.state.routes
            .filter((route) => mainCategories.includes(route.name))
            .map((route, index) => {
              const { options } = props.descriptors[route.key];
              const label =
                options.drawerLabel !== undefined
                  ? options.drawerLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name;
                  
              const isFocused = props.state.index === index;
              
              return (
                <TouchableOpacity
                  key={route.key}
                  style={[
                    styles.drawerItem,
                    isFocused && styles.drawerItemActive
                  ]}
                  onPress={() => {
                    props.navigation.navigate(route.name);
                  }}
                >
                  {options.drawerIcon ? 
                    options.drawerIcon({ 
                      color: isFocused ? COLORS.text.primary : COLORS.text.secondary, 
                      size: 24,
                      focused: isFocused
                    }) : null}
                  <Text 
                    style={[
                      styles.drawerLabel, 
                      isFocused && styles.drawerLabelActive
                    ]}
                  >
                    {label as string}
                  </Text>
                  {isFocused && (
                    <View style={styles.itemCount}>
                      <Text style={styles.countText}>12</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>
        
        {/* All labels section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={toggleLabels}
          >
            <Text style={styles.sectionTitle}>
              {showAllLabels ? 'HIDE LABELS' : 'ALL LABELS'}
            </Text>
            <Animated.View style={rotationStyle}>
              <Icon 
                name="keyboard-arrow-down" 
                size={20} 
                color={COLORS.text.secondary} 
              />
            </Animated.View>
          </TouchableOpacity>
          
          {showAllLabels && (
            <>
              {props.state.routes
                .filter((route) => labelCategories.includes(route.name))
                .map((route, index) => {
                  const actualIndex = mainCategories.length + index;
                  const { options } = props.descriptors[route.key];
                  const label =
                    options.drawerLabel !== undefined
                      ? options.drawerLabel
                      : options.title !== undefined
                      ? options.title
                      : route.name;
                      
                  const isFocused = props.state.index === actualIndex;
                  
                  return (
                    <TouchableOpacity
                      key={route.key}
                      style={[
                        styles.drawerItem,
                        isFocused && styles.drawerItemActive
                      ]}
                      onPress={() => {
                        props.navigation.navigate(route.name);
                      }}
                    >
                      {options.drawerIcon ? 
                        options.drawerIcon({ 
                          color: isFocused ? COLORS.text.primary : COLORS.text.secondary, 
                          size: 24,
                          focused: isFocused
                        }) : null}
                      <Text 
                        style={[
                          styles.drawerLabel, 
                          isFocused && styles.drawerLabelActive
                        ]}
                      >
                        {label as string}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </>
          )}
        </View>
        
        {/* Settings and help section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.drawerItem}>
            <Icon name="settings" size={24} color={COLORS.text.secondary} />
            <Text style={styles.drawerLabel}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.drawerItem}>
            <Icon name="help-outline" size={24} color={COLORS.text.secondary} />
            <Text style={styles.drawerLabel}>Help & feedback</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.medium,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 16,
    color: COLORS.text.primary,
  },
  scrollSection: {
    flex: 1,
  },
  section: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.medium,
    paddingBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text.secondary,
    letterSpacing: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 12,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  drawerLabel: {
    fontSize: 14,
    marginLeft: 16,
    color: COLORS.text.secondary,
  },
  drawerLabelActive: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  itemCount: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    color: COLORS.text.primary,
  },
}); 
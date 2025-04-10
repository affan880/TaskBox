import * as React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { EmailScreen } from '../screens/email/email-screen';
import { EmailDetailScreen } from '../screens/email/email-detail-screen';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { EmailDrawerContent } from '../components/email/email-drawer-content';
import { useTheme } from '../theme/theme-context';

// Define types for the drawer navigator
export type EmailDrawerParamList = { 
  AllInbox: undefined;
  Primary: undefined;
  Social: undefined;
  Promotions: undefined;
  Starred: undefined;
  Snoozed: undefined;
  Important: undefined;
  Sent: undefined;
  Scheduled: undefined;
  Drafts: undefined;
  Spam: undefined;
  Trash: undefined;
  EmailDetail: { email: any };
  ReadEmail: { email: any };
};

const Drawer = createDrawerNavigator<EmailDrawerParamList>();

export function EmailDrawerNavigator() {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const drawerWidth = Math.min(width * 0.85, 360);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <EmailDrawerContent {...props} />}
      screenOptions={{
        drawerType: 'slide',
        drawerStyle: {
          width: drawerWidth,
          backgroundColor: colors.background.secondary,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
        },
        headerTitleStyle: {
          color: colors.text.primary,
          fontSize: 18,
          fontWeight: '600',
        },
        swipeEdgeWidth: 80,
        headerTitleAlign: 'left',
      }}
    >
      <Drawer.Screen 
        name="AllInbox" 
        component={EmailScreen} 
        options={{
          title: 'All Inbox',
          headerShown: false,
          drawerLabel: 'All inbox',
          drawerIcon: ({ color, size }) => (
            <Icon name="all-inbox" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Primary" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Primary',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="inbox" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Social" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Social',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Promotions" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Promotions',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="local-offer" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Starred" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Starred',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="star" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Snoozed" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Snoozed',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="schedule" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Important" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Important',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="label-important" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Sent" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Sent',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="send" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Scheduled" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Scheduled',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="schedule-send" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Drafts" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Drafts',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="drafts" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Spam" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Spam',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="report" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Trash" 
        component={EmailScreen} 
        options={{
          drawerLabel: 'Trash',
          headerShown: false,
          drawerIcon: ({ color, size }) => (
            <Icon name="delete" size={size} color={color} />
          ),
        }}
      />
      
      {/* Email Detail Screen - Hidden from drawer */}
      <Drawer.Screen 
        name="EmailDetail" 
        component={EmailDetailScreen} 
        options={{
          title: 'Email',
          drawerLabel: () => null,
          drawerItemStyle: { display: 'none' },
          headerShown: false,
          swipeEnabled: false,
        }}
      />

      <Drawer.Screen 
        name="ReadEmail" 
        component={EmailDetailScreen} 
        options={{
          title: 'Email',
          drawerLabel: () => null,
          drawerItemStyle: { display: 'none' },
          headerShown: false,
          swipeEnabled: false,
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  menuButton: {
    padding: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchText: {
    fontSize: 15,
  },
  avatarContainer: {
    padding: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  drawerIcon: {
    width: 24,
    height: 24,
  },
}); 
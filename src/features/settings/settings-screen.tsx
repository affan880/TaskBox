import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme/theme-context';
import { useAuthStore } from '@/store/slices/auth-slice';
import { Button } from '@/components/ui/button';

type SettingsStackParamList = {
  Settings: undefined;
  DeleteAccount: undefined;
  ThemeSettings: undefined;
  NotificationSettings: undefined;
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  About: undefined;
};

type SettingsScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;

type SettingsSection = {
  title: string;
  items: {
    id: string;
    label: string;
    icon: string;
    iconColor: string;
    action: () => void;
    showArrow?: boolean;
    value?: string;
  }[];
};

export function SettingsScreen() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of TaskBox?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    navigation.navigate('DeleteAccount');
  };

  const settingsSections: SettingsSection[] = [
    {
      title: 'Account Management',
      items: [
        {
          id: 'connected-account',
          label: 'Connected Account',
          icon: 'account',
          iconColor: colors.brand.primary,
          value: user?.email || 'Not connected',
          action: () => {},
          showArrow: false,
        },
        {
          id: 'sign-out',
          label: 'Sign Out',
          icon: 'logout',
          iconColor: colors.status.error,
          action: handleSignOut,
          showArrow: false,
        },
        {
          id: 'delete-account',
          label: 'Delete Account',
          icon: 'delete',
          iconColor: colors.status.error,
          action: handleDeleteAccount,
          showArrow: true,
        },
      ],
    },
    {
      title: 'General',
      items: [
        {
          id: 'app-theme',
          label: 'App Theme',
          icon: 'theme-light-dark',
          iconColor: colors.brand.primary,
          value: isDark ? 'Dark' : 'Light',
          action: () => navigation.navigate('ThemeSettings'),
          showArrow: true,
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: 'bell-outline',
          iconColor: colors.status.warning,
          action: () => navigation.navigate('NotificationSettings'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'Help & Legal',
      items: [
        {
          id: 'help-support',
          label: 'Help & Support',
          icon: 'help-circle-outline',
          iconColor: colors.brand.secondary,
          action: () => navigation.navigate('HelpSupport'),
          showArrow: true,
        },
        {
          id: 'privacy-policy',
          label: 'Privacy Policy',
          icon: 'shield-outline',
          iconColor: colors.status.success,
          action: () => navigation.navigate('PrivacyPolicy'),
          showArrow: true,
        },
        {
          id: 'terms',
          label: 'Terms of Service',
          icon: 'file-document-outline',
          iconColor: colors.text.primary,
          action: () => navigation.navigate('TermsOfService'),
          showArrow: true,
        },
        {
          id: 'about',
          label: 'About TaskBox',
          icon: 'information-outline',
          iconColor: colors.brand.primary,
          action: () => navigation.navigate('About'),
          showArrow: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView style={styles.scrollView}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.surface.primary }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.settingItem,
                    itemIndex !== section.items.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border.light,
                    },
                  ]}
                  onPress={item.action}
                >
                  <View style={styles.settingLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '20' }]}>
                      <Icon name={item.icon} size={24} color={item.iconColor} />
                    </View>
                    <Text style={[styles.settingLabel, { color: colors.text.primary }]}>
                      {item.label}
                    </Text>
                  </View>
                  <View style={styles.settingRight}>
                    {item.value && (
                      <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
                        {item.value}
                      </Text>
                    )}
                    {item.showArrow && (
                      <Icon name="chevron-right" size={24} color={colors.text.tertiary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
}); 
import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackParamList } from '@/navigation/app-navigator';

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NotificationSettings'>;

type NotificationSetting = {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  enabled: boolean;
};

export function NotificationSettingsScreen() {
  const navigation = useNavigation<NotificationSettingsScreenNavigationProp>();
  const { colors } = useTheme();
  const [settings, setSettings] = React.useState<NotificationSetting[]>([
    {
      id: 'task-reminders',
      title: 'Task Reminders',
      description: 'Get notified about upcoming task deadlines',
      icon: 'bell-ring',
      iconColor: colors.brand.primary,
      enabled: true,
    },
    {
      id: 'email-notifications',
      title: 'Email Notifications',
      description: 'Receive notifications for new emails',
      icon: 'email',
      iconColor: colors.status.warning,
      enabled: true,
    },
    {
      id: 'project-updates',
      title: 'Project Updates',
      description: 'Get notified about project changes',
      icon: 'folder',
      iconColor: colors.status.success,
      enabled: true,
    },
    {
      id: 'daily-digest',
      title: 'Daily Digest',
      description: 'Receive a daily summary of your tasks and emails',
      icon: 'calendar-clock',
      iconColor: colors.brand.secondary,
      enabled: false,
    },
    {
      id: 'sound',
      title: 'Sound',
      description: 'Play sound for notifications',
      icon: 'volume-high',
      iconColor: colors.text.primary,
      enabled: true,
    },
    {
      id: 'vibration',
      title: 'Vibration',
      description: 'Vibrate for notifications',
      icon: 'vibrate',
      iconColor: colors.text.primary,
      enabled: true,
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prevSettings =>
      prevSettings.map(setting =>
        setting.id === id
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={[styles.header, { 
        backgroundColor: colors.brand.primary,
        transform: [{ rotate: '-1deg' }],
        borderWidth: 4,
        borderColor: '#000000',
        shadowColor: '#000000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 0,
        elevation: 8,
      }]}>
        <Text style={[styles.headerTitle, { color: '#FFFFFF', transform: [{ rotate: '1deg' }] }]}>
          Notifications
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { 
          color: colors.text.primary,
          transform: [{ rotate: '-1deg' }],
        }]}>
          Manage your notification preferences
        </Text>

        <View style={[styles.settingsList, {
          transform: [{ rotate: '1deg' }],
          borderWidth: 3,
          borderColor: '#000000',
          shadowColor: '#000000',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 0,
          elevation: 8,
        }]}>
          {settings.map((setting, index) => (
            <View
              key={setting.id}
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.surface.primary,
                  borderBottomWidth: index === settings.length - 1 ? 0 : 2,
                  borderBottomColor: '#000000',
                  transform: [{ rotate: index % 2 === 0 ? '-0.5deg' : '0.5deg' }],
                },
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { 
                  backgroundColor: setting.iconColor + '20',
                  borderWidth: 2,
                  borderColor: '#000000',
                  transform: [{ rotate: '-2deg' }],
                }]}>
                  <Icon name={setting.icon} size={24} color={setting.iconColor} />
                </View>
                <View style={[styles.settingInfo, { transform: [{ rotate: '1deg' }] }]}>
                  <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
                    {setting.title}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                    {setting.description}
                  </Text>
                </View>
              </View>
              <View style={[styles.switchContainer, {
                transform: [{ rotate: '2deg' }],
                borderWidth: 2,
                borderColor: '#000000',
                borderRadius: 16,
                padding: 2,
                backgroundColor: setting.enabled ? setting.iconColor + '20' : colors.surface.secondary,
              }]}>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: colors.border.light, true: setting.iconColor }}
                  thumbColor={colors.surface.primary}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.infoBox, { 
          backgroundColor: colors.surface.primary,
          transform: [{ rotate: '-1deg' }],
          borderWidth: 3,
          borderColor: '#000000',
          shadowColor: '#000000',
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 0,
          elevation: 8,
        }]}>
          <View style={[styles.infoIconContainer, {
            backgroundColor: colors.brand.primary + '20',
            borderWidth: 2,
            borderColor: '#000000',
            transform: [{ rotate: '2deg' }],
          }]}>
            <Icon name="information" size={24} color={colors.brand.primary} />
          </View>
          <Text style={[styles.infoText, { 
            color: colors.text.primary,
            transform: [{ rotate: '1deg' }],
          }]}>
            Some notifications may still appear based on your device settings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingsList: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
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
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  switchContainer: {
    overflow: 'hidden',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 24,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
}); 
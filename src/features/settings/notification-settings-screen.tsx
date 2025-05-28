import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type SettingsStackParamList = {
  Settings: undefined;
  NotificationSettings: undefined;
};

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'NotificationSettings'>;

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Notification Settings
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Manage your notification preferences
        </Text>

        <View style={styles.settingsList}>
          {settings.map((setting) => (
            <View
              key={setting.id}
              style={[
                styles.settingItem,
                {
                  backgroundColor: colors.surface.primary,
                  borderBottomColor: colors.border.light,
                },
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: setting.iconColor + '20' }]}>
                  <Icon name={setting.icon} size={24} color={setting.iconColor} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
                    {setting.title}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                    {setting.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: colors.border.light, true: setting.iconColor }}
                thumbColor={colors.surface.primary}
              />
            </View>
          ))}
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.brand.primary + '10' }]}>
          <Icon name="information" size={24} color={colors.brand.primary} />
          <Text style={[styles.infoText, { color: colors.text.primary }]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  settingsList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
}); 
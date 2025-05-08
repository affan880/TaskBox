import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/theme/theme-context';
import type { ThemeType } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/button';

type SettingsStackParamList = {
  Settings: undefined;
  ThemeSettings: undefined;
};

type ThemeSettingsScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'ThemeSettings'>;

type ThemeOption = {
  id: string;
  name: string;
  description: string;
  icon: string;
  isDark: boolean;
};

export function ThemeSettingsScreen() {
  const navigation = useNavigation<ThemeSettingsScreenNavigationProp>();
  const { colors, theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = React.useState<ThemeType>(theme);

  const themeOptions: ThemeOption[] = [
    {
      id: 'light',
      name: 'Light Theme',
      description: 'Clean and bright interface',
      icon: 'white-balance-sunny',
      isDark: false,
    },
    {
      id: 'dark',
      name: 'Dark Theme',
      description: 'Easy on the eyes in low light',
      icon: 'moon-waning-crescent',
      isDark: true,
    },
    {
      id: 'system',
      name: 'System Default',
      description: 'Follow your device settings',
      icon: 'theme-light-dark',
      isDark: theme === 'dark',
    },
  ];

  const handleSelectTheme = (value: ThemeType) => {
    setSelectedTheme(value);
    setTheme(value);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Choose your preferred theme
        </Text>

        <View style={styles.themeOptions}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.themeOption,
                selectedTheme === option.id && { borderColor: colors.brand.primary, borderWidth: 1 },
              ]}
              onPress={() => handleSelectTheme(option.id as ThemeType)}
              activeOpacity={0.8}
            >
              <Icon name={option.icon} size={28} color={colors.brand.primary} style={{ marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeTitle, { color: colors.text.primary }]}>{option.name}</Text>
                <Text style={[styles.themeDesc, { color: colors.text.secondary }]}>{option.description}</Text>
              </View>
              {selectedTheme === option.id && (
                <Icon name="check-circle" size={22} color={colors.brand.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.previewSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary, marginTop: 32 }]}>
            Preview
          </Text>
          <View style={[styles.previewCard, { backgroundColor: colors.surface.primary }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewAvatar, { backgroundColor: colors.brand.primary }]} />
              <View style={styles.previewText}>
                <View style={[styles.previewLine, { backgroundColor: colors.text.primary }]} />
                <View style={[styles.previewLine, { backgroundColor: colors.text.secondary, width: '60%' }]} />
              </View>
            </View>
            <View style={styles.previewContent}>
              <View style={[styles.previewLine, { backgroundColor: colors.text.primary, width: '80%' }]} />
              <View style={[styles.previewLine, { backgroundColor: colors.text.secondary, width: '90%' }]} />
              <View style={[styles.previewLine, { backgroundColor: colors.text.secondary, width: '70%' }]} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  themeOptions: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDesc: {
    fontSize: 14,
  },
  previewSection: {
    marginTop: 32,
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  previewText: {
    flex: 1,
    gap: 8,
  },
  previewContent: {
    gap: 8,
  },
  previewLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
}); 
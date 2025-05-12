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
          Theme Settings
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { 
          color: colors.text.primary,
          transform: [{ rotate: '-1deg' }],
        }]}>
          Choose your preferred theme
        </Text>

        <View style={styles.themeOptions}>
          {themeOptions.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.themeOption,
                { 
                  backgroundColor: colors.surface.primary,
                  transform: [{ rotate: index % 2 === 0 ? '1deg' : '-1deg' }],
                  borderWidth: 3,
                  borderColor: selectedTheme === option.id ? colors.brand.primary : '#000000',
                  shadowColor: '#000000',
                  shadowOffset: { width: 4, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 0,
                  elevation: 8,
                },
              ]}
              onPress={() => handleSelectTheme(option.id as ThemeType)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, {
                backgroundColor: option.isDark ? '#000000' : '#FFFFFF',
                borderWidth: 2,
                borderColor: '#000000',
                transform: [{ rotate: '-2deg' }],
              }]}>
                <Icon 
                  name={option.icon} 
                  size={28} 
                  color={option.isDark ? '#FFFFFF' : '#000000'} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeTitle, { 
                  color: colors.text.primary,
                  transform: [{ rotate: '1deg' }],
                }]}>
                  {option.name}
                </Text>
                <Text style={[styles.themeDesc, { 
                  color: colors.text.secondary,
                  transform: [{ rotate: '1deg' }],
                }]}>
                  {option.description}
                </Text>
              </View>
              {selectedTheme === option.id && (
                <View style={[styles.checkContainer, {
                  backgroundColor: colors.brand.primary,
                  borderWidth: 2,
                  borderColor: '#000000',
                  transform: [{ rotate: '2deg' }],
                }]}>
                  <Icon name="check" size={22} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.previewSection}>
          <Text style={[styles.sectionTitle, { 
            color: colors.text.primary,
            transform: [{ rotate: '1deg' }],
            marginTop: 32,
          }]}>
            Preview
          </Text>
          <View style={[styles.previewCard, { 
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
            <View style={styles.previewHeader}>
              <View style={[styles.previewAvatar, { 
                backgroundColor: colors.brand.primary,
                borderWidth: 2,
                borderColor: '#000000',
                transform: [{ rotate: '2deg' }],
              }]} />
              <View style={[styles.previewText, { transform: [{ rotate: '-1deg' }] }]}>
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
  themeOptions: {
    gap: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDesc: {
    fontSize: 14,
  },
  previewSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  previewCard: {
    padding: 16,
    borderRadius: 8,
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
    borderRadius: 8,
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
  },
}); 
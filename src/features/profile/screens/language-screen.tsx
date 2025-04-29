import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { toast } from '@/components/ui/toast';

const LANGUAGES = [
  { code: 'en', name: 'English', region: 'United States' },
  { code: 'es', name: 'Español', region: 'España' },
  { code: 'fr', name: 'Français', region: 'France' },
  { code: 'de', name: 'Deutsch', region: 'Deutschland' },
  { code: 'it', name: 'Italiano', region: 'Italia' },
  { code: 'pt', name: 'Português', region: 'Brasil' },
  { code: 'ru', name: 'Русский', region: 'Россия' },
  { code: 'ja', name: '日本語', region: '日本' },
  { code: 'ko', name: '한국어', region: '대한민국' },
  { code: 'zh', name: '中文', region: '中国' },
];

export function LanguageScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = React.useState('en');

  const handleLanguageSelect = (code: string) => {
    setSelectedLanguage(code);
    // TODO: Implement language change logic
    toast.show({
      message: 'Language updated successfully',
      type: 'success'
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { 
        borderBottomColor: colors.border.light,
        backgroundColor: colors.background.primary 
      }]}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Language
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          Select your preferred language
        </Text>

        <View style={[styles.languageList, { 
          backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary,
        }]}>
          {LANGUAGES.map((language, index) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                index !== LANGUAGES.length - 1 && { 
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.light,
                }
              ]}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageName, { color: colors.text.primary }]}>
                  {language.name}
                </Text>
                <Text style={[styles.languageRegion, { color: colors.text.tertiary }]}>
                  {language.region}
                </Text>
              </View>
              
              {selectedLanguage === language.code && (
                <Icon 
                  name="check" 
                  size={24} 
                  color={colors.brand.primary} 
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.note, { color: colors.text.tertiary }]}>
          Changing the language will restart the app to apply the changes.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 88 : 56,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  languageList: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  languageRegion: {
    fontSize: 14,
  },
  note: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 16,
  },
}); 
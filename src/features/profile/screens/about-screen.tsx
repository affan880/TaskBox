import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { version } from '../../../../package.json';

const LINKS = [
  {
    id: 'website',
    title: 'Visit Website',
    icon: 'web',
    url: 'https://taskbox.app',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: 'shield-check',
    url: 'https://taskbox.app/privacy',
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    icon: 'file-document',
    url: 'https://taskbox.app/terms',
  },
  {
    id: 'opensource',
    title: 'Open Source Libraries',
    icon: 'source-branch',
    url: 'https://taskbox.app/opensource',
  },
];

const SOCIAL_LINKS = [
  {
    id: 'twitter',
    icon: 'twitter',
    url: 'https://twitter.com/taskboxapp',
  },
  {
    id: 'github',
    icon: 'github',
    url: 'https://github.com/taskboxapp',
  },
  {
    id: 'linkedin',
    icon: 'linkedin',
    url: 'https://linkedin.com/company/taskboxapp',
  },
];

export function AboutScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('[AboutScreen] Error opening URL:', error);
    }
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
          About TaskBox
        </Text>
        
        <View style={styles.headerButton} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.text.primary }]}>
            TaskBox
          </Text>
          <Text style={[styles.version, { color: colors.text.secondary }]}>
            Version {version}
          </Text>
        </View>

        <View style={[styles.section, { 
          backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary 
        }]}>
          {LINKS.map((link, index) => (
            <TouchableOpacity
              key={link.id}
              style={[
                styles.linkItem,
                index !== LINKS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.light,
                }
              ]}
              onPress={() => handleOpenLink(link.url)}
            >
              <View style={styles.linkContent}>
                <Icon 
                  name={link.icon} 
                  size={24} 
                  color={colors.text.tertiary}
                  style={styles.linkIcon}
                />
                <Text style={[styles.linkText, { color: colors.text.primary }]}>
                  {link.title}
                </Text>
              </View>
              <Icon 
                name="chevron-right" 
                size={24} 
                color={colors.text.tertiary} 
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.socialLinks}>
          {SOCIAL_LINKS.map(link => (
            <TouchableOpacity
              key={link.id}
              style={[styles.socialButton, { 
                backgroundColor: isDark ? colors.surface.secondary : colors.surface.primary 
              }]}
              onPress={() => handleOpenLink(link.url)}
            >
              <Icon 
                name={link.icon} 
                size={24} 
                color={colors.text.primary} 
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.copyright, { color: colors.text.tertiary }]}>
          © 2025 TaskBox. All rights reserved.
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    fontSize: 15,
  },
  section: {
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
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkIcon: {
    marginRight: 16,
  },
  linkText: {
    fontSize: 16,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    gap: 16,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  copyright: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
}); 
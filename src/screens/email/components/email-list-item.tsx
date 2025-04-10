import React, { useCallback, useMemo, memo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { format } from 'date-fns';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { EmailData } from '../../../types/email';
import { useTheme } from '../../../theme/theme-context';
import { PaperclipIcon } from '../../../components/icons';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type EmailListItemProps = {
  email: EmailData;
  onPress: (emailId: string) => void;
  onLongPress?: (emailId: string) => void;
  isSelected?: boolean;
  isSelectMode?: boolean;
};

export const EmailListItem = memo(({ email, onPress, onLongPress, isSelected = false, isSelectMode = false }: EmailListItemProps) => {
  const { colors, isDark } = useTheme();
  const pressed = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const handlePress = useCallback(() => {
    onPress(email.id);
  }, [email.id, onPress]);
  
  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress(email.id);
    }
  }, [email.id, onLongPress]);
  
  const senderName = useMemo(() => {
    if (!email || !email.from) {
      return 'Unknown Sender';
    }
    
    try {
      const match = email.from.match(/^"?([^"<]+)"?\s*(?:<[^>]*>)?$/);
      return match ? match[1].trim() : email.from || 'Unknown Sender';
    } catch (e) {
      console.warn('Error parsing sender name:', e);
      return email.from || 'Unknown Sender';
    }
  }, [email?.from]);
  
  const formattedDate = useMemo(() => {
    if (!email || !email.date) {
      return '';
    }
    
    try {
      const date = new Date(email.date);
      return format(date, 'MMM d');
    } catch (e) {
      console.warn('Error formatting date:', e);
      return email.date || '';
    }
  }, [email?.date]);
  
  // Create animated styles for 3D tilt effect
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: interpolate(pressed.value, [0, 1], [0, -2], Extrapolate.CLAMP) }
      ],
      shadowOpacity: interpolate(pressed.value, [0, 1], [0.1, 0.15], Extrapolate.CLAMP),
      shadowRadius: interpolate(pressed.value, [0, 1], [8, 12], Extrapolate.CLAMP),
      elevation: interpolate(pressed.value, [0, 1], [4, 8], Extrapolate.CLAMP),
    };
  });
  
  // Get background color based on read/unread status and theme
  const getBgColor = () => {
    if (isSelected) {
      return colors.surface.highlight;
    }
    if (email.isUnread) {
      return isDark ? colors.surface.primary : '#FFFFFF';
    }
    return isDark ? colors.surface.secondary : '#F9F9F9';
  };
  
  return (
    <View style={styles.outerContainer}>
      <AnimatedPressable
        style={[
          styles.container,
          {
            backgroundColor: getBgColor(),
            borderColor: isDark ? colors.border.light : 'rgba(0,0,0,0.05)',
            shadowColor: isDark ? '#000000' : 'rgba(0,0,0,0.3)',
          },
          animatedCardStyle,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressIn={() => {
          pressed.value = 1;
          scale.value = withSpring(0.98, { damping: 10, stiffness: 400 });
        }}
        onPressOut={() => {
          pressed.value = 0;
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        accessibilityRole="button"
        accessibilityLabel={`Email from ${senderName}, subject: ${email.subject}`}
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text 
              numberOfLines={1} 
              style={[
                styles.sender, 
                { color: colors.text.primary },
                email.isUnread && styles.unread
              ]}
            >
              {senderName}
            </Text>
            <Text style={[styles.date, { color: colors.text.tertiary }]}>
              {formattedDate}
            </Text>
          </View>
          
          <Text 
            numberOfLines={1} 
            style={[
              styles.subject, 
              { color: colors.text.primary },
              email.isUnread && styles.unread
            ]}
          >
            {email.subject}
          </Text>
          
          <Text 
            numberOfLines={2} 
            style={[styles.preview, { color: colors.text.secondary }]}
          >
            {email.snippet}
          </Text>
          
          {email.hasAttachments && (
            <View style={[styles.attachmentIndicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <PaperclipIcon
                size={16}
                color={isDark ? colors.text.secondary : colors.text.tertiary}
                style={styles.attachIcon}
              />
              <Text style={[styles.attachmentText, { color: colors.text.secondary }]}>
                Attachments
              </Text>
            </View>
          )}
        </View>
      </AnimatedPressable>
    </View>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  container: {
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sender: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 14,
  },
  subject: {
    fontSize: 16,
    marginBottom: 8,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
  },
  unread: {
    fontWeight: '600',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
  },
  attachmentText: {
    fontSize: 12,
    marginLeft: 4,
  },
  attachIcon: {
    marginRight: 4,
  },
}); 
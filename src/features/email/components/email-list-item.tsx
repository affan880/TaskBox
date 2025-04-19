import React, { useCallback, useMemo, memo } from 'react';
import { StyleSheet, View, Text, Pressable, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { EmailData } from 'src/types/email';
import { useTheme } from 'src/theme/theme-context';
import { PaperclipIcon } from 'src/components/icons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../../theme/theme';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type EmailListItemProps = {
  email: EmailData;
  onPress: () => void;
  onLongPress: () => void;
  isSelected: boolean;
  onToggleRead: (emailId: string, isUnread: boolean) => void;
};

export function EmailListItem({ 
  email, 
  onPress, 
  onLongPress,
  isSelected,
  onToggleRead
}: EmailListItemProps) {
  const { colors } = useTheme();
  
  const handleToggleRead = useCallback(() => {
    onToggleRead(email.id, !email.isUnread);
  }, [email.id, email.isUnread, onToggleRead]);

  // Format date to show in a more readable format
  const formattedDate = useMemo(() => {
    const emailDate = new Date(email.date);
    const today = new Date();
    
    // Same day - show time
    if (emailDate.toDateString() === today.toDateString()) {
      return format(emailDate, 'h:mm a');
    }
    
    // This week - show day name
    const daysDiff = Math.floor((today.getTime() - emailDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return format(emailDate, 'EEE');
    }
    
    // This year - show date
    if (emailDate.getFullYear() === today.getFullYear()) {
      return format(emailDate, 'MMM d');
    }
    
    // Other years - show year
    return format(emailDate, 'MM/dd/yy');
  }, [email.date]);
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: email.isUnread 
            ? colors.background?.primary || '#ffffff' 
            : colors.surface?.primary || '#fafafa',
        },
        isSelected && { 
          backgroundColor: colors.surface?.highlight || 'rgba(100, 100, 255, 0.05)'
        }
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        {isSelected ? (
          <View style={[styles.checkbox, { backgroundColor: colors.brand?.primary || '#6366f1' }]}>
            <Icon name="check" size={16} color="#ffffff" />
          </View>
        ) : (
          <TouchableOpacity 
            onPress={handleToggleRead}
            style={[styles.unreadIndicator, { 
              backgroundColor: email.isUnread ? colors.brand?.primary || '#6366f1' : 'transparent',
              borderWidth: !email.isUnread ? 1 : 0,
              borderColor: colors.border?.medium || '#d1d5db',
            }]} 
          />
        )}
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text 
              style={[
                styles.sender,
                { color: colors.text?.primary || '#111827' },
                email.isUnread ? styles.boldText : styles.regularText
              ]}
              numberOfLines={1}
            >
              {email.from}
            </Text>
            <Text 
              style={[
                styles.date,
                { color: colors.text?.tertiary || '#6b7280' },
                email.isUnread && styles.boldText
              ]}
            >
              {formattedDate}
            </Text>
          </View>
          
          <Text 
            style={[
              styles.subject,
              { color: colors.text?.primary || '#111827' },
              email.isUnread ? styles.boldText : styles.regularText
            ]}
            numberOfLines={1}
          >
            {email.subject || '(No subject)'}
          </Text>
          
          <View style={styles.snippetContainer}>
            <Text 
              style={[
                styles.snippet,
                { color: colors.text?.secondary || '#4b5563' }
              ]}
              numberOfLines={2}
            >
              {email.snippet}
            </Text>
            
            {email.hasAttachments && (
              <Icon 
                name="attachment" 
                size={18} 
                color={colors.text?.secondary || '#4b5563'} 
                style={styles.attachmentIcon}
              />
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sender: {
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  boldText: {
    fontWeight: '600',
  },
  regularText: {
    fontWeight: '400',
  },
  date: {
    fontSize: 13,
  },
  subject: {
    fontSize: 15,
    marginBottom: 4,
  },
  snippetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snippet: {
    fontSize: 14,
    opacity: 0.8,
    flex: 1,
    lineHeight: 20,
  },
  attachmentIcon: {
    marginLeft: 8,
  },
}); 
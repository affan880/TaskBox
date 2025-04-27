import * as React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme/theme-context';

interface ComposeHeaderProps {
  onBack: () => void;
  onAddAttachment: () => void;
  onSend: () => void;
  isSending: boolean;
  isUploading: boolean;
  canSend: boolean;
}

export function ComposeHeader({
  onBack,
  onAddAttachment,
  onSend,
  isSending,
  isUploading,
  canSend,
}: ComposeHeaderProps): React.ReactElement {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border.light }]}>
      <TouchableOpacity 
        style={styles.headerButton} 
        onPress={onBack}
        accessibilityLabel="Back to inbox"
      >
        <Icon name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      
      <Text style={[styles.headerTitle, { color: colors.text.primary }]}>New Message</Text>
      
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={onAddAttachment}
          disabled={isSending}
          accessibilityLabel="Add attachment"
        >
          <Icon name="attach-file" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            { backgroundColor: colors.brand.primary },
            (isSending || isUploading || !canSend) && { opacity: 0.7 }
          ]} 
          onPress={onSend}
          disabled={isSending || isUploading || !canSend}
          accessibilityLabel="Send email"
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="send" size={18} color="#FFFFFF" style={styles.sendIcon} />
              <Text style={styles.sendButtonText}>Send</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  sendIcon: {
    marginRight: 4,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 
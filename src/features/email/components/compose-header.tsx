import * as React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/theme-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Props = {
  onBack: () => void;
  onAddAttachment: () => void;
  onSend: () => void;
  isSending: boolean;
  isUploading: boolean;
  canSend: boolean;
};

export function ComposeHeader({
  onBack,
  onAddAttachment,
  onSend,
  isSending,
  isUploading,
  canSend,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      className="flex-row items-center justify-between border-b px-4 py-3"
      style={{ borderBottomColor: colors.border.primary }}
    >
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={onBack}
          className="rounded-full p-2 active:bg-neutral-100"
        >
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text className="ml-3 text-lg font-semibold">New Message</Text>
      </View>

      <View className="flex-row items-center space-x-4">
        <TouchableOpacity
          onPress={onAddAttachment}
          disabled={isUploading}
          className="rounded-full p-2 active:bg-neutral-100"
        >
          <Icon name="attach-file" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSend}
          disabled={!canSend || isSending}
          className={`rounded-full p-2 ${
            canSend ? 'active:bg-neutral-100' : 'opacity-50'
          }`}
        >
          <Icon name="send" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
} 
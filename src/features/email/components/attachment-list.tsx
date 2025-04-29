import * as React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/theme-context';
import { XIcon } from '@/components/icons';
import type { Attachment } from '@/types';

type Props = {
  attachments: Attachment[];
  onRemoveAttachment: (id: string) => void;
};

export function AttachmentList({ attachments, onRemoveAttachment }: Props) {
  const { colors } = useTheme();

  return (
    <View>
      <Text className="mb-2 text-sm text-neutral-500">Attachments:</Text>
      <View className="flex-row flex-wrap gap-2">
        {attachments.map((attachment) => (
          <View
            key={attachment.id}
            className="flex-row items-center rounded-lg bg-neutral-100 px-3 py-2"
          >
            <Text className="mr-2 text-sm" numberOfLines={1}>
              {attachment.name}
            </Text>
            <TouchableOpacity
              onPress={() => onRemoveAttachment(attachment.id)}
              className="rounded-full p-1"
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <XIcon size={14} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
} 
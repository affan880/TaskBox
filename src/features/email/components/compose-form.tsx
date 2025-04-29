import * as React from 'react';
import { View, TextInput, ScrollView } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/theme/theme-context';
import { AttachmentList } from './attachment-list';
import type { Attachment } from '@/types';

type Props = {
  to: string;
  subject: string;
  body: string;
  attachments: Attachment[];
  onToChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onRemoveAttachment: (id: string) => void;
};

export function ComposeForm({
  to,
  subject,
  body,
  attachments,
  onToChange,
  onSubjectChange,
  onBodyChange,
  onRemoveAttachment,
}: Props) {
  const { colors } = useTheme();

  return (
    <ScrollView className="flex-1">
      <View className="p-4">
        <View className="mb-4 border-b" style={{ borderBottomColor: colors.border.primary }}>
          <Text className="mb-1 text-sm text-neutral-500">To:</Text>
          <TextInput
            value={to}
            onChangeText={onToChange}
            placeholder="Recipients"
            placeholderTextColor={colors.text.secondary}
            className="pb-2 text-base"
            style={{ color: colors.text.primary }}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
        </View>

        <View className="mb-4 border-b" style={{ borderBottomColor: colors.border.primary }}>
          <TextInput
            value={subject}
            onChangeText={onSubjectChange}
            placeholder="Subject"
            placeholderTextColor={colors.text.secondary}
            className="pb-2 text-base"
            style={{ color: colors.text.primary }}
          />
        </View>

        {attachments.length > 0 && (
          <View className="mb-4">
            <AttachmentList
              attachments={attachments}
              onRemoveAttachment={onRemoveAttachment}
            />
          </View>
        )}

        <TextInput
          value={body}
          onChangeText={onBodyChange}
          placeholder="Compose email"
          placeholderTextColor={colors.text.secondary}
          className="text-base"
          style={{ color: colors.text.primary }}
          multiline
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );
} 